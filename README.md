# Groupd

Groupd is a full-stack group assignment platform for colleges and training programs. It gives students a clean workflow for creating teams and confirming submissions, while giving admins one place to publish assignments and track completion without spreadsheet overhead.

## Why This Exists

Group assignment management usually breaks down at the handoff points:

- Students do not know who has formed a team.
- Faculty cannot quickly see which groups submitted.
- Historical data gets messy when groups are edited or removed.

Groupd solves this with role-aware workflows, audited group submissions, and analytics that answer progress questions in one screen.

## Overview of Implementation

### Frontend (React + Vite)

- Role-segmented UX: public auth pages, student workspace, and admin workspace.
- Zustand stores manage auth, groups, assignments, submissions, and theming.
- Axios interceptors attach JWT access tokens and auto-refresh on 401.
- Recharts powers admin analytics visualizations.

### Backend (Node.js + Express)

- Clean service architecture: Routes -> Controllers -> Services -> Models.
- Zod request validation at route boundaries.
- JWT-based auth with access, refresh, and submission confirmation tokens.
- Centralized error handling and standardized response envelopes.

### Database (PostgreSQL)

- Core entities: users, groups, assignments, assignment_groups, submissions.
- Group-centric submission model with one submission per assignment per group.
- Submission snapshots preserve group name history even after group deletion.

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

## Tech Stack

- Frontend: React 19, Vite 8, Tailwind CSS 4, Zustand, React Router, Recharts
- Backend: Node.js, Express, pg, Zod, JWT, Winston
- Security: Helmet, CORS, route-specific and global rate limiting
- Infra: Docker Compose, PostgreSQL 16, Nginx (frontend container)

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

### Option A: Docker (Recommended)

1. Build and start all services.

```bash
docker compose up --build -d
```

2. Verify health.

```bash
curl http://localhost:5000/api/v1/health
```

3. Seed demo student accounts.

```bash
docker compose exec backend node seed_users.js
```

4. Open applications.

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000/api/v1
- PostgreSQL: localhost:5432

5. Optional: create an end-to-end demo group + assignment.

```bash
node setup_demo.js
```

6. Stop services.

```bash
docker compose down
```

7. Full reset (including DB volume).

```bash
docker compose down -v --remove-orphans
docker compose up --build -d
```

### Option B: Local Development

1. Start PostgreSQL (dockerized DB is fine if you want local app processes):

```bash
docker compose up -d postgres
```

2. Backend setup:

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

## Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Purpose | Example |
|---|---|---|---|
| DATABASE_URL | Yes | PostgreSQL connection string | postgresql://groupd_user:groupd_pass@localhost:5432/groupd |
| JWT_SECRET | Yes | Access token and submission confirmation signing secret | change-this-to-a-random-secret-string |
| JWT_REFRESH_SECRET | Yes | Refresh token signing secret | change-this-to-another-random-secret |
| PORT | Yes | API server port | 5000 |
| CORS_ORIGIN | Yes | Allowed frontend origins (comma-separated supported) | http://localhost:5173 |
| NODE_ENV | No | Runtime mode | development |

### Frontend (`frontend/.env`)

| Variable | Required | Purpose | Example |
|---|---|---|---|
| VITE_API_URL | Yes | API base URL used by Axios client | http://localhost:5000/api/v1 |

## Demo Credentials

- Admin: admin@groupd.com / test@123
- Students (after seeding): s1@groupd.com to s15@groupd.com / test@123

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
- Assignment due_date must be a valid future ISO datetime.
- assign_to = specific requires at least one group_id.
- Assignment status is computed server-side as upcoming, active, or overdue.
- A group can submit an assignment only once.

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
2. PostgreSQL migrations mounted to `/docker-entrypoint-initdb.d` and executed in lexical order at init time.
3. Frontend containerized behind Nginx for production-like static hosting behavior.
4. Environment-only backend config to avoid hardcoded runtime secrets.
5. Health-check based service ordering (`postgres` healthy before backend startup).

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

## Current Status

- End-to-end auth, group, assignment, submission, and dashboard modules are implemented.
- Student and admin roles are enforced on both route and business-logic layers.
- Docker startup provisions PostgreSQL schema and default admin account automatically.
