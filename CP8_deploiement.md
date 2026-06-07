# CP8 – Documentation de déploiement
## Unauthorized Sectors — Portfolio web dynamique

**Candidat :** Antonin Tacchi
**Formation :** Développeur Web et Web Mobile (DWWM) — Titre Professionnel Niveau 5
**Date :** Mars 2026

---

## 1. Présentation de l'application

**Unauthorized Sectors** est un portfolio web dynamique destiné à présenter des modèles 3D (MLO / mappings FiveM).
Il comprend :

| Composant | Technologie | Rôle |
|-----------|-------------|------|
| Frontend  | React 19 + Vite + TailwindCSS | SPA servie en statique |
| Backend   | Node.js 20 + Express 5 | API REST JSON |
| Base NoSQL | MongoDB 7 | Projets, filtres, médias, paramètres |
| Base SQL  | MySQL 8.4 | Tickets de support |
| Stockage fichiers | Cloudflare R2 (S3-compatible) | Modèles 3D et images |
| Orchestration | Docker Compose | Environnement local / staging |

---

## 2. Architecture de déploiement

```
Internet
   │
   ▼
[Reverse Proxy — Nginx / Caddy]
   ├─▶ /api/*        → Backend  (port 3000, Node.js)
   └─▶ /*            → Frontend statique (dist/)
          │
          ├─▶ MongoDB 7    (port interne 27017)
          └─▶ MySQL 8.4    (port interne 3306)
```

Les deux bases de données tournent dans des conteneurs Docker isolés sur le même réseau interne `portfolio_net`. Elles ne sont **pas exposées** sur Internet.

---

## 3. Pré-requis serveur

| Outil | Version minimale |
|-------|-----------------|
| Docker Engine | 24.x |
| Docker Compose | 2.x (`docker compose`) |
| Node.js | 20 LTS (pour build frontend) |
| npm | 10+ |

---

## 4. Variables d'environnement

Copier `.env.example` vers `.env` dans le dossier `Backend/` et renseigner toutes les valeurs.

```bash
cp Backend/.env.example Backend/.env
```

### Variables obligatoires

| Variable | Rôle |
|----------|------|
| `MONGO_URI` | URI de connexion MongoDB (inclut login/password) |
| `MONGO_ROOT_USERNAME` | Login root MongoDB |
| `MONGO_ROOT_PASSWORD` | Mot de passe root MongoDB |
| `MONGO_DB` | Nom de la base MongoDB |
| `MYSQL_HOST` | Hôte MySQL (`mysql` dans Docker, `localhost` hors Docker) |
| `MYSQL_PORT` | Port MySQL (défaut : 3306) |
| `MYSQL_ROOT_PASSWORD` | Mot de passe root MySQL |
| `MYSQL_DATABASE` | Nom de la base MySQL (`tickets_db`) |
| `MYSQL_USER` | Utilisateur applicatif MySQL |
| `MYSQL_PASSWORD` | Mot de passe utilisateur MySQL |
| `JWT_SECRET` | Clé secrète JWT (min. 64 caractères aléatoires) |
| `PORT` | Port d'écoute du serveur Node.js (ex : 3000) |
| `ADMIN_EMAIL` | Email du compte administrateur initial |
| `ADMIN_PASSWORD` | Mot de passe du compte administrateur initial |

### Variables optionnelles

| Variable | Rôle |
|----------|------|
| `R2_ACCOUNT_ID` | ID compte Cloudflare R2 |
| `R2_ACCESS_KEY_ID` | Clé d'accès R2 |
| `R2_SECRET_ACCESS_KEY` | Clé secrète R2 |
| `R2_BUCKET` | Nom du bucket R2 |
| `R2_PUBLIC_URL` | URL publique du bucket R2 |
| `DISCORD_WEBHOOK_URL` | Webhook Discord pour les notifications tickets |
| `ME_CONFIG_BASICAUTH` | Login:password pour Mongo Express (dev seulement) |

---

## 5. Déploiement avec Docker Compose

### 5.1 Cloner le dépôt

```bash
git clone https://github.com/<user>/unauthorized_sectors.git
cd unauthorized_sectors
```

### 5.2 Configurer l'environnement

```bash
cp Backend/.env.example Backend/.env
# Éditer Backend/.env avec les vraies valeurs
nano Backend/.env
```

### 5.3 Lancer les bases de données et le seed

```bash
cd Backend
docker compose up -d mongo mysql
# Attendre que les healthchecks passent (~30s)
docker compose up seed
```

Le service `seed` :
1. Installe les dépendances npm
2. Crée le compte admin dans MongoDB (`script/db/seed.js`)
3. Insère des projets de démo (`script/db/seed-projects.fake.js`)

La base MySQL est initialisée automatiquement par le script `db/mysql-init/init.sql` au premier démarrage du conteneur.

### 5.4 Lancer le backend

```bash
# En développement (rechargement automatique)
npm run dev

# En production
npm start
```

Ou via Docker (si un Dockerfile Backend est présent) :

```bash
docker compose up -d backend
```

### 5.5 Build et déploiement du frontend

```bash
cd Frontend
npm ci
npm run build        # Génère dist/
```

Servir le dossier `Frontend/dist/` avec Nginx ou Caddy.
Le fichier `.htaccess` (inclus) gère le routing SPA pour Apache.

---

## 6. Schéma de la base relationnelle (MySQL)

### Table `tickets`

```sql
CREATE TABLE tickets (
  id                INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  ticket_number     VARCHAR(10)  NOT NULL UNIQUE,           -- ex: TK-0001
  email             VARCHAR(255) NOT NULL,
  discord           VARCHAR(100) NOT NULL DEFAULT '',
  subject           ENUM('Custom MLO','Exterior Mapping',
                         'Optimization','Bug Report','Other') NOT NULL,
  priority          ENUM('low','medium','high') NOT NULL DEFAULT 'low',
  message           TEXT NOT NULL,
  status            ENUM('open','in-progress','resolved','closed')
                         NOT NULL DEFAULT 'open',
  discord_message_id VARCHAR(30) NOT NULL DEFAULT '',
  admin_notes       TEXT NOT NULL DEFAULT '',
  resolved_at       DATETIME DEFAULT NULL,
  created_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
                         ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

Ce script est exécuté automatiquement via le mécanisme `docker-entrypoint-initdb.d` de l'image MySQL officielle.

---

## 7. Endpoints de l'API Tickets (SQL)

| Méthode | URL | Auth | Description |
|---------|-----|------|-------------|
| POST | `/api/tickets` | Non | Créer un ticket (limité à 5 req/15 min par IP) |
| GET | `/api/tickets` | JWT admin | Lister les tickets (pagination, filtres status/priority) |
| GET | `/api/tickets/:id` | JWT admin | Détail d'un ticket |
| PATCH | `/api/tickets/:id/status` | JWT admin | Changer le statut + notes admin |
| DELETE | `/api/tickets/:id` | JWT admin | Supprimer un ticket |

---

## 8. Accès aux outils d'administration (développement)

| Service | URL | Identifiants |
|---------|-----|--------------|
| Mongo Express | `http://localhost:8081` | Valeur de `ME_CONFIG_BASICAUTH` |
| MySQL (port mappé) | `localhost:3307` | `MYSQL_USER` / `MYSQL_PASSWORD` |

> ⚠️ Mongo Express et le port MySQL mappé ne doivent **jamais** être exposés en production.

---

## 9. Mise à jour de l'application

```bash
git pull origin main
cd Backend && npm ci
cd ../Frontend && npm ci && npm run build
# Redémarrer le backend
docker compose restart backend   # ou pm2 restart backend
```

---

## 10. Vérification du déploiement

```bash
# Santé des conteneurs
docker compose ps

# Logs en temps réel
docker compose logs -f backend

# Test rapide de l'API
curl http://localhost:3000/api/projects
# → doit retourner un tableau JSON

# Test MySQL
docker compose exec mysql mysql -u tickets_user -ptickets_pass tickets_db \
  -e "SELECT COUNT(*) FROM tickets;"
```

---

## 11. Sauvegarde des données

### MongoDB

```bash
docker compose exec mongo mongodump \
  --uri="mongodb://$MONGO_ROOT_USERNAME:$MONGO_ROOT_PASSWORD@localhost:27017/$MONGO_DB?authSource=admin" \
  --out /backup/$(date +%Y%m%d)
```

### MySQL

```bash
docker compose exec mysql mysqldump \
  -u root -p$MYSQL_ROOT_PASSWORD tickets_db \
  > backup_tickets_$(date +%Y%m%d).sql
```

---

## 12. Choix techniques justifiés

| Décision | Justification |
|----------|---------------|
| **MongoDB pour les projets** | Structure flexible (champs variables selon le type de projet), pas de schéma rigide nécessaire |
| **MySQL pour les tickets** | Données structurées, relations claires, contraintes d'intégrité (ENUM, NOT NULL), requêtes de reporting par statut/priorité |
| **Docker Compose** | Reproductibilité : même environnement en dev, staging et production |
| **JWT stateless** | Pas de session côté serveur, compatible déploiement multi-instance |
| **Rate limiting sur POST /tickets** | Protection contre le spam de formulaire de contact (5 requêtes / 15 min / IP) |
| **Cloudflare R2** | Stockage objet S3-compatible à faible coût pour les fichiers 3D volumineux |
