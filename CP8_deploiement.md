## 1. Présentation du projet

**Nom du projet :** Portfolio FiveM — Antonin TACCHI
**URL de production :** https://antonin-tacchi.com
**Type d'application :** Application web full-stack (SPA React + API REST Node.js)
**Auteur :** Antonin TACCHI

### Description
Application web de portfolio professionnel pour un mappeur FiveM. Elle permet de présenter des projets (MLO, exterior mapping), de recevoir des commissions via un système de tickets, et d'administrer l'ensemble du contenu via un panneau d'administration sécurisé.

---

## 2. Architecture technique

```
┌─────────────────────────────────────────────────────────┐
│                     CLIENT (navigateur)                  │
│            React SPA — Hostinger (CDN statique)          │
│                  https://antonin-tacchi.com              │
└───────────────────────┬─────────────────────────────────┘
                        │ HTTPS / REST API
┌───────────────────────▼─────────────────────────────────┐
│              BACK-END — Railway (cloud)                  │
│         Node.js 20 + Express.js — Port 3000              │
│    https://antonin-tacchi-production.up.railway.app      │
└──────────┬────────────────────────┬─────────────────────┘
           │                        │
┌──────────▼──────────┐  ┌──────────▼──────────────────┐
│  MongoDB (Docker)   │  │   MySQL 8.4 (Docker)         │
│  Base NoSQL         │  │   Base relationnelle          │
│  Projets, médias,   │  │   Tickets de commissions     │
│  paramètres, admins │  │   tickets_db                 │
└─────────────────────┘  └─────────────────────────────┘
```

### Choix techniques justifiés

| Technologie | Rôle | Justification |
|-------------|------|---------------|
| **React 18 + Vite** | Frontend SPA | Composants réutilisables, routing client-side, performances de build |
| **Node.js 20 + Express** | API REST | JavaScript isomorphe, écosystème npm riche, non-bloquant |
| **MongoDB 7** | Base NoSQL | Schéma flexible pour les projets (médias variés, tags dynamiques) |
| **MySQL 8.4** | Base relationnelle | Données structurées et contraintes fortes pour les tickets (CP5/CP6) |
| **Docker Compose** | Orchestration | Reproductibilité de l'environnement, isolation des services |
| **Railway** | Hébergement back-end | Déploiement continu via Git, variables d'environnement sécurisées |
| **Hostinger** | Hébergement front-end | CDN statique haute performance, HTTPS automatique |

---

## 3. Prérequis

### Environnement de développement
- **Node.js** v20 ou supérieur
- **npm** v9 ou supérieur
- **Docker Desktop** v24 ou supérieur
- **Git**

### Environnement de production
- Compte **Railway** (back-end)
- Compte **Hostinger** avec hébergement web (front-end)
- Nom de domaine configuré (antonin-tacchi.com)

---

## 4. Variables d'environnement

Créer un fichier `.env` à la racine du dossier `Backend/` :

```env
# ── Serveur ──────────────────────────────────────────────
NODE_ENV=production
PORT=3000

# ── MongoDB ──────────────────────────────────────────────
MONGO_URI=mongodb://user:password@localhost:27018/portfolio?authSource=admin
MONGO_ROOT_USERNAME=admin
MONGO_ROOT_PASSWORD=motdepasse_fort
MONGO_DB=portfolio

# ── MySQL ────────────────────────────────────────────────
MYSQL_HOST=localhost          # "mysql" en production Docker
MYSQL_PORT=3307               # 3306 en production Docker
MYSQL_ROOT_PASSWORD=root_pass
MYSQL_DATABASE=tickets_db
MYSQL_USER=tickets_user
MYSQL_PASSWORD=tickets_pass

# ── Authentification admin ───────────────────────────────
JWT_SECRET=secret_jwt_tres_long_et_aleatoire
ADMIN_DEFAULT_PASSWORD=motdepasse_admin

# ── CORS ─────────────────────────────────────────────────
ALLOWED_ORIGINS=https://antonin-tacchi.com

# ── Upload fichiers ──────────────────────────────────────
CLOUDINARY_CLOUD_NAME=nom_cloud
CLOUDINARY_API_KEY=cle_api
CLOUDINARY_API_SECRET=secret_api

# ── Discord Bot ──────────────────────────────────────────
DISCORD_BOT_TOKEN=token_bot
DISCORD_CLIENT_ID=id_client_oauth
DISCORD_CLIENT_SECRET=secret_oauth
DISCORD_GUILD_ID=id_serveur
DISCORD_TICKETS_CATEGORY_ID=id_categorie
DISCORD_ARCHIVE_CATEGORY_ID=id_categorie_archive
DISCORD_ADMIN_USER_ID=id_admin_discord

# ── Mail ─────────────────────────────────────────────────
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=email@example.com
SMTP_PASS=motdepasse_smtp
```

---

## 5. Schéma de base de données MySQL

La base `tickets_db` contient une table principale :

```sql
CREATE TABLE IF NOT EXISTS tickets (
  id                   INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  ticket_number        VARCHAR(10)  NOT NULL UNIQUE,
  email                VARCHAR(255) NOT NULL,
  discord              VARCHAR(100) NOT NULL DEFAULT '',
  subject              ENUM('Custom MLO','Exterior Mapping','Optimization',
                            'Bug Report','Other') NOT NULL,
  priority             ENUM('low','medium','high') NOT NULL DEFAULT 'low',
  budget               VARCHAR(100) NOT NULL DEFAULT '',
  timeline             VARCHAR(100) NOT NULL DEFAULT '',
  message              TEXT         NOT NULL,
  status               ENUM('open','in-progress','resolved','closed')
                            NOT NULL DEFAULT 'open',
  discord_message_id   VARCHAR(30)  NOT NULL DEFAULT '',
  discord_thread_id    VARCHAR(30)  NOT NULL DEFAULT '',
  discord_channel_id   VARCHAR(30)  NOT NULL DEFAULT '',
  admin_notes          TEXT         NOT NULL DEFAULT '',
  resolved_at          DATETIME     DEFAULT NULL,
  created_at           DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at           DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
                            ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Justification du choix relationnel :** Les tickets de commission ont une structure fixe et des contraintes d'intégrité fortes (statuts, priorités via ENUM). MySQL garantit la cohérence des données et permet des requêtes SQL complexes (filtres multi-critères, statistiques).

---

## 6. Endpoints API REST

| Méthode | Route | Description | Auth |
|---------|-------|-------------|------|
| GET | `/api/health` | Vérification état serveur | Non |
| GET | `/api/projects` | Liste des projets (pagination, filtres) | Non |
| GET | `/api/projects/:slug` | Détail d'un projet | Non |
| GET | `/api/projects/stats` | Statistiques par type | Non |
| POST | `/api/tickets` | Créer un ticket de commission | Non |
| GET | `/api/tickets` | Liste des tickets | Admin |
| PUT | `/api/tickets/:id` | Modifier un ticket | Admin |
| DELETE | `/api/tickets/:id` | Supprimer un ticket | Admin |
| POST | `/api/auth/login` | Connexion administrateur | Non |
| POST | `/api/auth/logout` | Déconnexion | Admin |
| GET | `/api/admin/dashboard` | Statistiques admin | Admin |
| POST | `/api/upload` | Upload d'image (Cloudinary) | Admin |
| GET | `/api/filters` | Configuration des filtres | Non |
| GET | `/api/settings` | Paramètres du site | Non |
| GET | `/api/visits` | Statistiques de visites | Admin |
| POST | `/api/discord/exchange` | OAuth2 Discord | Non |

---

## 7. Déploiement en développement local

### 7.1 Cloner le projet

```bash
git clone https://github.com/votre-repo/unauthorized_sectors.git
cd unauthorized_sectors
```

### 7.2 Démarrer les bases de données (Docker)

```bash
cd Backend
cp .env.example .env
# Remplir les variables dans .env

docker compose up mongo mysql -d
```

### 7.3 Démarrer le back-end

```bash
npm install
npm run dev
# Serveur disponible sur http://localhost:3000
```

### 7.4 Démarrer le front-end

```bash
cd ../Frontend
npm install
npm run dev
# Application disponible sur http://localhost:5173
```

---

## 8. Déploiement en production

### 8.1 Front-end — Hostinger

1. Dans le dossier `Frontend/`, construire le projet :
   ```bash
   npm run build
   ```
2. Le dossier `dist/` est généré avec tous les fichiers statiques.
3. Se connecter au **hPanel Hostinger** → File Manager → `public_html/`
4. Uploader le contenu du dossier `dist/` (index.html + dossier `assets/`)
5. Vérifier que le fichier `.htaccess` est présent pour le routing SPA :
   ```apache
   Options -MultiViews
   RewriteEngine On
   RewriteCond %{REQUEST_FILENAME} !-f
   RewriteRule ^ index.html [QSA,L]
   ```

### 8.2 Back-end — Railway

1. Se connecter à [railway.app](https://railway.app)
2. Créer un nouveau projet → **Deploy from GitHub repo**
3. Sélectionner le dossier `Backend/` comme root directory
4. Ajouter toutes les variables d'environnement dans l'onglet **Variables**
5. Railway détecte automatiquement le `Dockerfile` et lance le build
6. Le déploiement est automatique à chaque `git push` sur la branche `main`

### 8.3 Déploiement complet avec Docker Compose (serveur VPS)

```bash
cd Backend
docker compose up --build -d
```

**Ordre de démarrage automatique :**
1. `mongo` + `mysql` démarrent en premier (healthcheck)
2. `backend` démarre après que les deux bases soient healthy
3. `seed` s'exécute une seule fois pour initialiser les données

Vérifier que tout est opérationnel :
```bash
docker compose ps
# Tous les services doivent être "healthy" ou "running"

curl http://localhost:3000/api/health
# Réponse attendue : {"ok": true}
```

---

## 9. Sécurité

| Mesure | Implémentation |
|--------|---------------|
| **Authentification** | JWT (JSON Web Token) stocké en cookie HttpOnly |
| **Rate limiting** | 200 requêtes / 15 min par IP (express-rate-limit) |
| **CORS** | Whitelist des origines autorisées via `ALLOWED_ORIGINS` |
| **Mots de passe** | Hashés avec bcrypt (coût 12) |
| **Variables sensibles** | Jamais commitées, gérées via `.env` et Railway Variables |
| **HTTPS** | Activé automatiquement sur Hostinger et Railway |
| **Cache-Control** | Données tickets : `no-store` / Données publiques : `max-age=60` |

---

## 10. Sauvegarde et maintenance

### Sauvegarde MongoDB
```bash
docker exec portfolio_mongo mongodump \
  --uri="mongodb://admin:password@localhost:27017/portfolio?authSource=admin" \
  --out=/backup/$(date +%Y-%m-%d)
```

### Sauvegarde MySQL
```bash
docker exec portfolio_mysql mysqldump \
  -u root -p tickets_db > backup_tickets_$(date +%Y-%m-%d).sql
```

### Mise à jour de l'application
```bash
git pull origin main
docker compose up --build -d backend
```

---

## 11. Surveillance et logs

```bash
# Logs en temps réel de tous les services
docker compose logs -f

# Logs du back-end uniquement
docker compose logs -f backend

# État de santé des services
docker compose ps
```

---

## 12. Justifications des choix d'architecture

### Pourquoi deux bases de données ?

- **MongoDB** pour les projets : structure flexible adaptée aux contenus créatifs (nombre de médias variable, tags libres, champs optionnels nombreux). Pas de schéma rigide nécessaire.
- **MySQL** pour les tickets : données métier structurées avec des statuts, priorités et contraintes d'intégrité strictes. Les requêtes SQL permettent des filtrages et statistiques précis. Ce choix répond également aux exigences REAC CP5/CP6 (base de données relationnelle).

### Pourquoi séparer front-end et back-end sur deux hébergeurs ?

- **Hostinger** (front-end statique) : optimisé pour servir des fichiers HTML/CSS/JS avec CDN, moins coûteux pour du statique.
- **Railway** (back-end Node.js) : supporte les applications serveur avec processus persistant, déploiement continu via Git.

### Pourquoi Docker Compose ?

Garantit que l'environnement est identique entre développement et production. Chaque développeur peut lancer le projet complet avec une seule commande sans configurer MongoDB et MySQL localement.
