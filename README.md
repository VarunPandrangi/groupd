# Groupd

Groupd is a student group and assignment management platform built with React, Node.js, Express, PostgreSQL, and Docker.

## Quick Start (Docker)

### Prerequisites

- Docker Desktop (or Docker Engine + Compose plugin)

### 1. Start the full stack

From the repository root:

```bash
docker compose up --build -d
```

This starts:

- `postgres` on port `5432`
- `backend` on port `5000`
- `frontend` on port `3000`

### 2. Fresh database initialization (migrations in lexical order)

If you want a brand-new database build where init scripts run from scratch:

```bash
docker compose down -v
docker compose up --build -d
```

PostgreSQL runs SQL init files from `/docker-entrypoint-initdb.d` in lexical filename order on first initialization. The compose mount uses `./backend/src/db/migrations` for this, so files like `001_*`, `002_*`, `003_*`, `004_*`, etc. execute in order on a fresh volume.

### 3. Seed demo student users

Admin is seeded during fresh DB initialization. To seed student demo users:

```bash
docker compose exec backend node seed_users.js
```

Default demo credentials:

- Admin: `admin@groupd.com` / `test@123`
- Students: `s1@groupd.com` ... `s15@groupd.com` / `test@123`

### 4. Access the app

- Frontend: http://localhost:3000
- Backend API base: http://localhost:5000/api/v1
- Backend health: http://localhost:5000/api/v1/health
- PostgreSQL: localhost:5432 (`groupd` / `groupd_user`)

### 5. Stop services

```bash
docker compose down
```
