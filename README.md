# Groupd

Groupd is a full-stack group assignment platform for colleges and training programs. It gives students a clean workflow for creating teams and confirming submissions, while giving admins one place to publish assignments and track completion without spreadsheet overhead.

## WALKTHROUGH VIDEO

LOOM VIDEO: [Watch the walkthrough](https://www.loom.com/share/e842348597ef48b088427ca2a15443fa)

## Why This Exists

Group assignment management usually breaks down at the handoff points:

- Students do not know who has formed a team.
- Faculty cannot quickly see which groups submitted.
- Historical data gets messy when groups are edited or removed.

Groupd solves this with role-aware workflows, audited group submissions, and analytics that answer progress questions in one screen.

## Code-Backed Implementation Overview

### Frontend (React + Vite)

- Route tree is role-gated at runtime via `ProtectedRoute`:
    - Public: `/`, `/login`, `/register`
    - Student: `/student/dashboard`, `/student/assignments`, `/student/assignments/:id`, `/student/group`, `/student/group/create`, `/student/progress`
    - Admin: `/admin/dashboard`, `/admin/assignments`, `/admin/assignments/new`, `/admin/assignments/:id`, `/admin/groups`, `/admin/groups/:id`, `/admin/submissions`
- Auth/session is store-driven (`authStore`) with:
    - `refreshToken` persisted in `localStorage`
    - `accessToken` held in memory
    - startup `checkAuth()` flow: refresh -> `/auth/me`
- Axios client (`frontend/src/services/api.js`) implements queued 401 refresh handling so concurrent failed requests wait for a single refresh call.
- Assignment submission UX is truly two-step in UI:
    - click "Mark as Submitted" -> `/submissions/prepare`
    - confirm dialog -> `/submissions` with `confirmation_token`

### Backend (Node.js + Express)

- Layering is strictly followed: Routes -> Controllers -> Services -> Models.
- Middleware order in `app.js` is:
    `helmet` -> `cors` -> `morgan` -> `express.json` -> `generalLimiter` -> routes -> `errorHandler`.
- `authLimiter` is applied only on `/api/v1/auth/*` endpoints.
- JWT model:
    - Access token: 15m
    - Refresh token: 7d
    - Submission confirmation token: 5m
- Validation is Zod-based for request bodies and UUID middleware for IDs.

### Database (PostgreSQL)

- Core tables: `users`, `groups`, `assignments`, `assignment_groups`, `submissions`.
- Submissions are group-centric (`UNIQUE (assignment_id, group_id)`).
- Group deletion keeps submission history by allowing `submissions.group_id` to become `NULL` while preserving `group_name` snapshot.

## Architecture Overview (Frontend + Backend + DB Flow)

```mermaid
flowchart LR
    U[Student/Admin Browser] --> UI[React App + Zustand]
    UI --> API[Express API /api/v1]
    API --> MW[Auth + Role Guard + Validation + Rate Limit]
    MW --> SVC[Service Layer Business Rules]
    SVC --> MODEL[Model Layer SQL]
    MODEL --> DB[(PostgreSQL)]
    DB --> MODEL
    MODEL --> SVC
    SVC --> API
    API --> RESP[Standard JSON Response]
    RESP --> UI
```

### Request Lifecycle in Practice

1. A page action triggers a Zustand store method.
2. The store calls a service wrapper built on Axios.
3. Axios sends Bearer tokens and retries once after refresh if needed.
4. Express middleware authenticates the user, checks role, validates payload, and applies rate limiting.
5. Services execute business rules and authorization logic.
6. Models run parameterized SQL against PostgreSQL.
7. Responses return in a predictable JSON contract for UI consistency.

## Real Process Flows (As Implemented)

### 1) Authentication and Session Lifecycle

1. Student self-registers via `POST /api/v1/auth/register` (role is always `student` server-side).
2. Login returns `accessToken` + `refreshToken` + user profile.
3. Frontend stores `refreshToken` in `localStorage`, keeps `accessToken` in memory.
4. On app boot, `checkAuth()` attempts `POST /auth/refresh` then `GET /auth/me`.
5. If access token expires during API calls, Axios response interceptor refreshes once and replays queued requests.
6. If refresh fails, client logs out and redirects to `/login`.

### 2) Student Group Lifecycle

1. Student can create exactly one group only if `users.group_id IS NULL`.
2. Group leader is `groups.created_by` and has privileged actions:
    - add member (by email or student ID)
    - remove member
    - delete group
3. Group constraints enforced in service layer:
    - max 6 members
    - cannot add admin users
    - cannot add a user already in another group
    - leader cannot remove self
    - leader cannot leave group (must delete it)

### 3) Assignment Lifecycle (Admin)

1. Admin creates assignment with `assign_to = all | specific`.
2. If `specific`, backend validates every `group_id` exists before insert.
3. Assignment updates support switching scope (`all <-> specific`) and remap `assignment_groups` accordingly.
4. Deletion is soft-delete (`is_deleted = true`).
5. Assignment status is computed on read:
    - `overdue`: due date <= now
    - `active`: due date within next 3 days
    - `upcoming`: everything else in future

### 4) Submission Confirmation (Two-Step)

1. Student requests confirmation token: `POST /submissions/prepare`.
2. Backend verifies eligibility (group exists, assignment assigned to group, not already submitted).
3. Backend returns short-lived confirmation token (`expires_in_seconds = 300`).
4. Student confirms: `POST /submissions` with `assignment_id` + `confirmation_token`.
5. Backend validates token action/user/group/assignment binding, then inserts submission.
6. Duplicate submits are blocked by both service checks and DB unique constraint.

### 5) Admin Submission Tracking and Analytics

1. Submission tracker endpoint `GET /submissions/assignment/:assignmentId/groups-student-status` returns:
    - assignment summary (`submitted_groups`, `total_groups`, `pending_groups`)
    - per-group rows
    - member lists for active groups
    - special rows for deleted groups with preserved submission history
2. Admin analytics endpoints compute completion from SQL at query time, including historical deleted-group submissions.

### 6) Group Deletion and Historical Integrity

1. Deleting a group releases all member `group_id` links.
2. Existing submission rows remain.
3. If original group no longer exists, APIs surface `group_name` snapshot and fallback note to keep audit continuity.

## Tech Stack

- Frontend: React 19, Vite 8, Tailwind CSS 4, Zustand, React Router, Recharts
- Backend: Node.js, Express, pg, Zod, JWT, Winston
- Security: Helmet, CORS, route-specific and global rate limiting
- Infra: Docker Compose, PostgreSQL 16, Nginx (frontend container)

## Runtime Services and Ports

When started via Docker Compose, these services run:

| Service | Container | Port | Notes |
|---|---|---|---|
| Postgres | `groupd-db` | 5432 | Initializes schema from `/docker-entrypoint-initdb.d` on first volume creation |
| Backend API | `groupd-backend` | 5000 | Express API at `/api/v1` |
| Frontend | `groupd-frontend` | 3000 | Static Vite build served by Nginx |

Startup dependency order in Compose:
1. `postgres` starts and becomes healthy.
2. `backend` starts after Postgres healthcheck passes.
3. `frontend` starts after backend container is up.

`docker-compose.yml` does not define Docker Compose `profiles`; `docker compose up` starts all services by default.

## Project Structure

```text
.
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── db/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── utils/
│   │   └── validators/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── layouts/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── stores/
│   │   ├── styles/
│   │   └── utils/
├── docker-compose.yml
├── seed_test_data.js
├── setup_demo.js
└── README.md
```

## Setup and Run Instructions

### Prerequisites

- Docker Desktop (recommended for fastest full-stack startup)
- Node.js 20+
- npm 10+

### Reproducible Quick Start (Fresh Clone)

From a brand-new clone, this is the shortest path to a working local environment:

```bash
git clone https://github.com/VarunPandrangi/groupd.git
cd groupd
docker compose up --build -d
docker compose exec backend node seed_users.js
```

Then verify the API is healthy:

```bash
curl http://localhost:5000/api/v1/health
```

Then open:

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000/api/v1

### Option A: Docker (Recommended)

1. Start the stack.

```bash
docker compose up --build -d
```

2. Confirm API health.

```bash
curl http://localhost:5000/api/v1/health
```

3. Seed demo student accounts (idempotent upsert by email).

```bash
docker compose exec backend node seed_users.js
```

4. (Optional) seed/register demo accounts through API instead of DB direct insert.

```bash
node seed_test_data.js
```

5. (Optional) create demo-ready data (ensures one student group + one assignment if missing).

```bash
node setup_demo.js
```

6. Open applications.

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000/api/v1
- PostgreSQL: localhost:5432

7. Stop services.

```bash
docker compose down
```

8. Full reset (including DB volume).

```bash
docker compose down -v --remove-orphans
docker compose up --build -d
```

### Option B: Local Development

1. Start PostgreSQL only (containerized), but run backend/frontend on host:

```bash
docker compose up -d postgres
```

2. Backend setup (new terminal):

```bash
cd backend
npm install
copy .env.example .env
npm run dev
```

3. Frontend setup (new terminal):

```bash
cd frontend
npm install
echo VITE_API_URL=http://localhost:5000/api/v1 > .env
npm run dev
```

4. Local URLs:

- Frontend (Vite): http://localhost:5173
- Backend API: http://localhost:5000/api/v1

### Database Initialization and Migration Truth

- Docker Postgres auto-runs SQL files from `/docker-entrypoint-initdb.d` only when the DB volume is empty.
- In this repo, Docker mounts:
    - `backend/src/db/migrations` directory
    - `backend/src/db/seeds/seed_admin.sql` as `/docker-entrypoint-initdb.d/zz_seed_admin.sql`
- The repository file `backend/src/db/migrations/zz_seed_admin.sql` is empty; admin seeding actually comes from `backend/src/db/seeds/seed_admin.sql` via Docker bind mount.
- Manual migration script `node src/db/migrate.js` executes SQL files from `backend/src/db/migrations`, but it does not load `.env` by itself. Set `DATABASE_URL` in shell before using it.

## Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Purpose | Example |
|---|---|---|---|
| DATABASE_URL | Yes | PostgreSQL connection string | postgresql://groupd_user:groupd_pass@localhost:5432/groupd |
| JWT_SECRET | Yes | Access token and submission confirmation signing secret | change-this-to-a-random-secret-string |
| JWT_REFRESH_SECRET | Yes | Refresh token signing secret | change-this-to-another-random-secret |
| PORT | Yes | API server port | 5000 |
| CORS_ORIGIN | Yes | Allowed frontend origins (comma-separated supported) | http://localhost:3000,http://localhost:5173 |
| NODE_ENV | No | Runtime mode | development |

### Frontend (`frontend/.env`)

| Variable | Required | Purpose | Example |
|---|---|---|---|
| VITE_API_URL | Yes | API base URL used by Axios client | http://localhost:5000/api/v1 |

`CORS_ORIGIN` is split by commas in backend config, so you can safely allow both Docker frontend (`3000`) and local Vite frontend (`5173`) at once.

## Demo Credentials

- Admin: admin@groupd.com / test@123 (seeded from `backend/src/db/seeds/seed_admin.sql`, mounted by Docker as `/docker-entrypoint-initdb.d/zz_seed_admin.sql` during first DB init)
- Students: s1@groupd.com to s15@groupd.com / test@123 (created when you run `node seed_users.js` inside backend container)

Student seed behavior:

- Script path: `backend/seed_users.js`
- It upserts users on email conflict, so you can rerun safely.
- It uses bcrypt hash with salt rounds = 12.

If admin login is missing on an older database volume, reinitialize Postgres once:

```bash
docker compose down -v --remove-orphans
docker compose up --build -d
```

Then reseed students:

```bash
docker compose exec backend node seed_users.js
```

## Runtime Profiles (Roles)

Groupd has three app-level user profiles:

- Public profile:
    - frontend routes: `/`, `/login`, `/register`
    - backend routes: `/auth/register`, `/auth/login`, `/auth/refresh`, `/health`
- Student profile:
    - frontend routes under `/student/*`
    - backend permissions on groups/submissions/student dashboard/assignment reads
- Admin profile:
    - frontend routes under `/admin/*`
    - backend permissions on assignment CRUD, group listing/detail, submission trackers, admin analytics

To reproduce all profile experiences locally after cloning:

1. Start services (`docker compose up --build -d`).
2. Seed students (`docker compose exec backend node seed_users.js`).
3. Sign in as admin for admin flows, then sign in as any seeded student for student flows.

## API Endpoint Details

Base path: `/api/v1`

### Auth Model

- Access token TTL: 15 minutes
- Refresh token TTL: 7 days
- Submission confirmation token TTL: 5 minutes

### Response Contract

Most endpoints return:

```json
{
  "success": true,
  "data": {},
  "message": ""
}
```

Error format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "details": null
  }
}
```

Pagination endpoints (`GET /groups` and admin `GET /assignments`) include top-level `pagination` metadata.

Known response-shape exceptions in current implementation:

- `GET /health` returns `{ status, timestamp }` (no success envelope).
- `validateId` middleware error path returns `{ message, param }` for malformed UUID params (not the standard `error.code/details` envelope).

Role-specific payload shape for `GET /assignments`:

- Admin response: `data` is an array of assignments + top-level `pagination`.
- Student response: `data` is `{ assignments: [...] }` (no top-level pagination).

### Health

| Method | Endpoint | Auth | Role | Notes |
|---|---|---|---|---|
| GET | /health | No | Public | Lightweight readiness check |

### Auth

| Method | Endpoint | Auth | Role | Body |
|---|---|---|---|---|
| POST | /auth/register | No | Public | full_name, email, student_id, password |
| POST | /auth/login | No | Public | email, password |
| POST | /auth/refresh | No | Public | refreshToken |
| GET | /auth/me | Yes | Student/Admin | None |

### Groups

| Method | Endpoint | Auth | Role | Body/Query |
|---|---|---|---|---|
| POST | /groups | Yes | Student | name, description? |
| GET | /groups/my-group | Yes | Student | None |
| POST | /groups/members | Yes | Student | email or student_id |
| DELETE | /groups/members/:userId | Yes | Student | Path UUID |
| POST | /groups/leave | Yes | Student | None |
| DELETE | /groups | Yes | Student | None |
| GET | /groups | Yes | Admin | page?, limit? |
| GET | /groups/:groupId | Yes | Admin | Path UUID |

### Assignments

| Method | Endpoint | Auth | Role | Body/Query |
|---|---|---|---|---|
| POST | /assignments | Yes | Admin | title, description?, due_date, onedrive_link, assign_to, group_ids? |
| PUT | /assignments/:id | Yes | Admin | Partial update of create fields |
| DELETE | /assignments/:id | Yes | Admin | Path UUID |
| GET | /assignments | Yes | Student/Admin | page?, limit? (admin only) |
| GET | /assignments/:id | Yes | Student/Admin | Path UUID |

### Submissions

| Method | Endpoint | Auth | Role | Body |
|---|---|---|---|---|
| POST | /submissions/prepare | Yes | Student | assignment_id |
| POST | /submissions | Yes | Student | assignment_id, confirmation_token |
| GET | /submissions/my-group-submissions | Yes | Student | None |
| GET | /submissions/group-progress | Yes | Student | None |
| GET | /submissions/assignment/:assignmentId | Yes | Admin | Path UUID |
| GET | /submissions/assignment/:assignmentId/groups-student-status | Yes | Admin | Path UUID |

### Dashboard

| Method | Endpoint | Auth | Role | Notes |
|---|---|---|---|---|
| GET | /dashboard/student | Yes | Student | Group context + assignment counters + upcoming deadlines |
| GET | /dashboard/admin/summary | Yes | Admin | Totals + overall completion |
| GET | /dashboard/admin/assignments-analytics | Yes | Admin | Per-assignment completion |
| GET | /dashboard/admin/groups-analytics | Yes | Admin | Per-group completion |

### Validation and Behavior Highlights

- Passwords must be at least 8 chars and include a number and special character.
- Group names are unique and constrained to letters, numbers, spaces, and hyphens.
- Group size is capped at 6 students.
- Admin users cannot be added to student groups.
- Group leader cannot remove self or leave group directly.
- Assignment due_date must be a valid future ISO datetime.
- assign_to = specific requires at least one group_id.
- `group_ids` are validated against existing groups during create/update.
- Assignment status is computed server-side as upcoming, active, or overdue.
- A group can submit an assignment only once.
- Submission finalization requires a 5-minute confirmation token bound to user + group + assignment.

## Database Schema and Relationships

### Core Tables

| Table | Purpose | Important Constraints |
|---|---|---|
| users | Student/admin identity and group membership | Unique email, unique student_id, role checks |
| groups | Team metadata and leader reference | Unique group name |
| assignments | Assignment definitions and scope mode | assign_to in (all, specific), soft delete flag |
| assignment_groups | Junction for specifically targeted groups | Unique (assignment_id, group_id) |
| submissions | Group-level confirmation records | Unique (assignment_id, group_id), historical group_name snapshot |

### Relationship Notes

- One student can belong to at most one group via users.group_id.
- A group leader is tracked by groups.created_by.
- Assignment targeting is either all groups or specific groups via assignment_groups.
- Submissions are group-centric, not individual-centric.
- If a group is deleted, member links are released and submission history is retained.

### ER Diagram

```mermaid
erDiagram
    USERS {
        uuid id PK
        string full_name
        string email
        string student_id
        string role
        uuid group_id FK
        timestamptz created_at
        timestamptz updated_at
    }

    GROUPS {
        uuid id PK
        string name
        string description
        uuid created_by FK
        timestamptz created_at
        timestamptz updated_at
    }

    ASSIGNMENTS {
        uuid id PK
        string title
        text description
        timestamptz due_date
        text onedrive_link
        string assign_to
        boolean is_deleted
        uuid created_by FK
        timestamptz created_at
        timestamptz updated_at
    }

    ASSIGNMENT_GROUPS {
        uuid id PK
        uuid assignment_id FK
        uuid group_id FK
        timestamptz created_at
    }

    SUBMISSIONS {
        uuid id PK
        uuid assignment_id FK
        uuid group_id FK
        string group_name
        uuid submitted_by FK
        timestamptz confirmed_at
        timestamptz created_at
    }

    GROUPS ||--o{ USERS : has_members
    USERS o|--|| GROUPS : belongs_to
    USERS ||--o{ GROUPS : leads
    USERS ||--o{ ASSIGNMENTS : creates
    ASSIGNMENTS ||--o{ ASSIGNMENT_GROUPS : scopes
    GROUPS ||--o{ ASSIGNMENT_GROUPS : selected_for
    ASSIGNMENTS ||--o{ SUBMISSIONS : receives
    GROUPS o|--o{ SUBMISSIONS : confirms_for
    USERS ||--o{ SUBMISSIONS : confirmed_by
```

### Indexing Strategy

The schema includes targeted indexes for common filters and joins:

- users(email), users(student_id), users(group_id)
- assignments(due_date), assignments(is_deleted)
- assignment_groups(assignment_id), assignment_groups(group_id)
- submissions(assignment_id), submissions(group_id), submissions(submitted_by)

## Key Design Decisions

1. Group-level submission confirmation instead of per-student submission.
2. Two-step submission confirmation (`/submissions/prepare` then `/submissions`) to reduce accidental submissions.
3. Soft delete for assignments to preserve historical analytics while hiding inactive items.
4. Submission group name snapshots to retain audit context after group deletion.
5. Layered backend architecture to keep business logic centralized and testable.
6. Store-driven frontend data flow to keep role-based pages predictable and maintainable.

## Key Deployment Decisions

1. Docker Compose as the default operational path for reproducible environments.
2. PostgreSQL init SQL is mounted to `/docker-entrypoint-initdb.d` and executed in lexical order on first volume initialization only.
3. Admin seed is provided by mounting `backend/src/db/seeds/seed_admin.sql` as `zz_seed_admin.sql` inside the Postgres init directory.
4. Frontend containerized behind Nginx for production-like static hosting behavior.
5. Environment-only backend config to avoid hardcoded runtime secrets.
6. Health-check based service ordering (`postgres` healthy before backend startup).

## Operational Notes

- Students can see global assignments (`assign_to = all`) even before joining a group.
- Group-targeted assignments and submission actions require group membership.
- Admin analytics aggregate assignment and group completion using real-time query calculations.

## Useful Commands

```bash
# Seed student users (from repo root, with stack running)
docker compose exec backend node seed_users.js

# Register demo students through API script
node seed_test_data.js

# Create demo-ready group + assignment flow
node setup_demo.js
```

## Troubleshooting (Real Cases)

### `node src/db/migrate.js` fails with connection/env errors

Cause: migration script does not call `dotenv.config()`.

Fix options:

1. Prefer Docker-init migrations (`docker compose up`) for this repo.
2. If running migrate manually, set `DATABASE_URL` in your shell before executing.

### Admin account missing after code updates

Cause: Postgres init scripts only run on a fresh DB volume.

Fix:

```bash
docker compose down -v --remove-orphans
docker compose up --build -d
```

### Frontend gets CORS errors

Cause: backend `CORS_ORIGIN` does not include the current frontend origin.

Fix: set backend `CORS_ORIGIN` to include both, e.g. `http://localhost:3000,http://localhost:5173`.

## Current Status

- End-to-end auth, group, assignment, submission, and dashboard modules are implemented.
- Student and admin roles are enforced on both route and business-logic layers.
- Docker startup provisions PostgreSQL schema and default admin account automatically.
