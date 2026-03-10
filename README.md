# Unauthorized Sectors — Portfolio FiveM Mapping

Portfolio showcase for Antonin TACCHI's FiveM mapping projects. Features a 3D model viewer, admin dashboard, media management, and contact form.

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite 7, TailwindCSS, Framer Motion |
| 3D Viewer | Three.js / React Three Fiber + Draco compression |
| Backend | Node.js (ESM), Express 5, MongoDB + Mongoose |
| Auth | JWT (access 15min in-memory + refresh 7d httpOnly cookie) |
| Storage | Cloudflare R2 (3D models) · Cloudinary (images/videos) |
| Email | Nodemailer (SMTP) |
| Infra | Docker Compose (mongo, mongo-express, backend, seed) |

## Project Structure

```
.
├── Backend/
│   ├── src/
│   │   ├── app.js              # Express app (CORS, rate-limit, routes)
│   │   ├── server.js           # Entry point (env validation, DB connect)
│   │   ├── config/             # validateEnv.js, db.js
│   │   ├── controllers/        # projects, admin, auth, contact, media, upload, settings
│   │   ├── middleware/         # auth.js (requireAuth JWT)
│   │   ├── models/             # Project, User, Settings
│   │   ├── routes/             # index.js + per-resource routers
│   │   └── services/           # mailer.service.js, r2.service.js
│   ├── script/db/              # seed.js, seed-projects.fake.js, create-admin.js
│   ├── db/init/                # MongoDB init scripts
│   ├── Dockerfile
│   ├── docker-compose.yml
│   └── .env.example
└── Frontend/
    ├── src/
    │   ├── components/         # Header, ProjectCard, SafeImage, LoadingButton, …
    │   ├── context/            # AuthContext, ThemeContext, FavoritesContext
    │   ├── hooks/              # useDebounce
    │   ├── layout/             # AdminLayout, RootLayout
    │   ├── pages/              # Home, Projects, ProjectDetails, About, Contact
    │   │   └── admin/          # Login, Dashboard, AdminProjects, AdminStats, …
    │   ├── routes/             # React Router config
    │   └── services/           # api helpers
    └── .env.example
```

## Prerequisites

- Node.js 20+
- Docker + Docker Compose (for MongoDB)
- A Cloudinary account (images/videos)
- A Cloudflare R2 bucket (3D `.glb` models) — optional

## Quick Start (Development)

### 1 — Clone

```bash
git clone https://github.com/YOUR_USERNAME/unauthorized_sectors.git
cd unauthorized_sectors
```

### 2 — Start MongoDB

```bash
cd Backend
cp .env.example .env   # fill in your values
docker compose up -d mongo mongo-express
```

### 3 — Backend

```bash
cd Backend
npm install
npm run seed            # insert base projects
npm run seed:fake:40    # insert 40 fake projects (optional)
npm run create-admin    # create the admin user
npm run dev
# API available at http://localhost:3000
```

### 4 — Frontend

```bash
cd Frontend
cp .env.example .env   # fill in your values
npm install
npm run dev
# App available at http://localhost:5173
```

## Docker (Production)

Starts MongoDB + mongo-express + backend + seed in one command:

```bash
cd Backend
cp .env.example .env   # fill in your values
docker compose up -d --build
```

| Service | Port | Description |
|---------|------|-------------|
| MongoDB | 27018 | Database |
| mongo-express | 8081 | DB admin UI |
| backend | 3000 | REST API |

## Environment Variables

### Backend — `Backend/.env`

| Variable | Required | Description |
|----------|----------|-------------|
| `MONGO_URI` | ✅ | Full MongoDB connection string |
| `MONGO_ROOT_USERNAME` | ✅ | MongoDB root user (Docker) |
| `MONGO_ROOT_PASSWORD` | ✅ | MongoDB root password (Docker) |
| `MONGO_DB` | ✅ | Database name |
| `JWT_SECRET` | ✅ | Secret for signing JWT tokens |
| `PORT` | ✅ | Express server port (default `3000`) |
| `NODE_ENV` | — | `development` or `production` |
| `ALLOWED_ORIGINS` | prod | Comma-separated allowed CORS origins |
| `ADMIN_EMAIL` | — | Admin account email (used by create-admin) |
| `ADMIN_PASSWORD` | — | Admin account password |
| `SMTP_HOST` | — | SMTP server host |
| `SMTP_PORT` | — | SMTP server port |
| `SMTP_USER` | — | SMTP username |
| `SMTP_PASS` | — | SMTP password / app password |
| `CONTACT_EMAIL` | — | Email address that receives contact form submissions |
| `ME_CONFIG_BASICAUTH` | — | mongo-express basic auth (`user:password`) |

### Frontend — `Frontend/.env`

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_URL` | — | Backend URL (empty = same origin) |
| `VITE_CLOUDINARY_CLOUD_NAME` | ✅ | Cloudinary cloud name |
| `VITE_CLOUDINARY_UPLOAD_PRESET` | ✅ | Cloudinary unsigned upload preset |

## Key Commands

```bash
# Backend
npm run dev              # start with nodemon
npm run start            # production start
npm run seed             # seed base data
npm run seed:fake:40     # seed 40 fake mapping projects
npm run create-admin     # create admin account

# Frontend
npm run dev              # Vite dev server
npm run build            # production build → dist/
npm run preview          # preview production build
```

## API Routes

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/api/projects` | — | List projects (filter, search, paginate) |
| GET | `/api/projects/:slug` | — | Project details + view increment |
| POST | `/api/projects` | JWT | Create project |
| PUT | `/api/projects/:id` | JWT | Update project |
| DELETE | `/api/projects/:id` | JWT | Delete project |
| POST | `/api/auth/login` | — | Admin login |
| POST | `/api/auth/refresh` | cookie | Refresh access token |
| POST | `/api/auth/logout` | cookie | Clear refresh cookie |
| GET | `/api/admin/stats` | JWT | Dashboard statistics |
| GET | `/api/filters` | — | Available tag/filter values |
| POST | `/api/contact` | — | Send contact email |
| GET | `/api/media` | — | List media assets |
| POST | `/api/upload/image` | JWT | Upload image to Cloudinary |
| POST | `/api/upload/model` | JWT | Upload `.glb` to R2 + Draco compress |
| GET | `/api/settings` | JWT | Get site settings |
| PUT | `/api/settings` | JWT | Update site settings |
| GET | `/api/health` | — | Health check |

## Features

- **3D Viewer** — GLB models with Draco compression, orbit controls, environment lighting
- **Before/After slider** — Compare two states of a mapping
- **Admin dashboard** — Create/edit/delete projects, upload media, manage settings
- **Statistics page** — Total views, favorites, top 5 projects, 30-day activity chart
- **Dark/Light mode** — CSS variable-based theme with localStorage persistence
- **Favorites** — Client-side favorites persisted in localStorage
- **Toast notifications** — react-hot-toast on all async actions
- **Anti-spam views** — IP+slug cache with 1h TTL before re-counting a view
- **Rate limiting** — 100 req/15min global, 10 req/15min on POST /projects
- **Refresh token auth** — 15min access token in memory + 7d httpOnly secure cookie
