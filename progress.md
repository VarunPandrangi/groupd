# JoinEazy — Progress Tracker

> **Purpose:** This file is a living record of what has been built, what works, what broke, and what was learned. The agentic AI reads this file at the start of every sprint to understand the current state of the codebase and avoid re-doing work or breaking existing features.
>
> **Update rules:** After completing each sprint, fill in EVERY section — what was built (files created/modified), verification results (pass/fail each test), issues encountered (with details), and any architectural decisions or deviations from plan.md.

---

## Quick Status

| Sprint | Name | Branch | Status | Files Changed | Key Outcome |
|--------|------|--------|--------|---------------|-------------|
| 0 | Scaffolding | `varun/project-setup` | ⏳ Not started | — | — |
| 1 | Auth Backend | `varun/auth-backend` | ⏳ Not started | — | — |
| 2 | Auth Frontend | `varun/auth-ui-and-landing` | ⏳ Not started | — | — |
| 3 | Groups Backend | `varun/groups-api` | ⏳ Not started | — | — |
| 4 | Groups Frontend | `varun/groups-ui` | ⏳ Not started | — | — |
| 5 | Assignments Backend | `varun/assignments-api` | ⏳ Not started | — | — |
| 6 | Assignments Frontend | `varun/assignments-ui` | ⏳ Not started | — | — |
| 7 | Submissions Backend | `varun/submissions-api` | ⏳ Not started | — | — |
| 8 | Submissions Frontend | `varun/submissions-and-progress-ui` | ⏳ Not started | — | — |
| 9 | Dashboard Backend | `varun/dashboard-analytics-api` | ⏳ Not started | — | — |
| 10 | Dashboard Frontend | `varun/dashboards` | ⏳ Not started | — | — |
| 11 | UI Polish | `varun/ui-polish-pass` | ⏳ Not started | — | — |
| 12 | Docker & Docs | `varun/docker-and-docs` | ⏳ Not started | — | — |
| 13 | QA | `varun/final-qa` | ⏳ Not started | — | — |

**Status legend:** ⏳ Not started | 🔄 In progress | ✅ Complete | ⚠️ Complete with issues | ❌ Blocked

---

## What Currently Exists in the Codebase

> **AI: Read this section before every sprint.** It tells you exactly what files exist and what is functional right now. This prevents you from re-creating files that already exist or importing from files that don't.

### Backend State
- **Server running:** No (Sprint 0 not complete)
- **Database schema applied:** No
- **Working API endpoints:** None
- **Middleware implemented:** None
- **Models implemented:** None
- **Services implemented:** None

### Frontend State
- **App compiles:** No (Sprint 0 not complete)
- **Routing works:** No
- **Auth flow works:** No
- **Styling system works:** No
- **Stores implemented:** None
- **Pages implemented:** None

### Infrastructure State
- **Docker Compose:** Does not exist yet
- **PostgreSQL:** Not running
- **Seed data:** None

---

## Sprint Details

---

### Sprint 0 — Project Scaffolding

**Branch:** `varun/project-setup`  
**Status:** ⏳ Not started  
**Started:**  
**Completed:**  
**Merged to main:**  

#### What Was Built

_Fill in after completing the sprint. List every file created with a one-line description._

**Backend files created:**
- [ ] backend/package.json — Node.js project with ES modules
- [ ] backend/src/server.js — Entry point, starts Express
- [ ] backend/src/app.js — Express app with middleware chain
- [ ] backend/src/config/database.js — PostgreSQL connection pool
- [ ] backend/src/config/env.js — Environment variable validation
- [ ] backend/src/config/cors.js — CORS configuration
- [ ] backend/src/utils/apiResponse.js — Standardized response helpers
- [ ] backend/src/utils/logger.js — Winston logger
- [ ] backend/src/db/migrations/001_initial_schema.sql — Complete schema
- [ ] backend/src/db/seeds/seed_admin.sql — Default admin user
- [ ] backend/.env.example — Environment variable template
- [ ] All middleware placeholder files (auth, roleGuard, validate, errorHandler, rateLimiter)
- [ ] All route, controller, service, model, validator placeholder files

**Frontend files created:**
- [ ] frontend/package.json — Vite + React project
- [ ] frontend/vite.config.js — Vite with Tailwind plugin
- [ ] frontend/src/styles/index.css — CSS variables, fonts, base styles
- [ ] frontend/src/App.jsx — Complete React Router setup
- [ ] frontend/src/main.jsx — App entry point
- [ ] frontend/src/services/api.js — Axios instance with interceptors
- [ ] frontend/src/stores/authStore.js — Empty Zustand skeleton
- [ ] All layout files (PublicLayout, StudentLayout, AdminLayout)
- [ ] All placeholder page components
- [ ] All placeholder common components

**Root files created:**
- [ ] docker-compose.yml — PostgreSQL service
- [ ] .gitignore
- [ ] README.md — Skeleton

#### Verification Results

| Test | Pass/Fail | Notes |
|------|-----------|-------|
| docker-compose up -d → PostgreSQL running | | |
| Schema applied (tables exist in DB) | | |
| npm run dev (backend) → port 5000 | | |
| GET /api/v1/health → { status: ok } | | |
| npm run dev (frontend) → port 5173 | | |
| All routes resolve without errors | | |
| No console errors in browser | | |

#### Issues Encountered

_None yet. Record any issues, with how they were resolved._

#### Deviations from plan.md

_None yet. If you did something differently from the plan, explain why._

#### State After This Sprint

_After completing, update the "What Currently Exists" section above._

---

### Sprint 1 — Auth Backend

**Branch:** `varun/auth-backend`  
**Status:** ⏳ Not started  
**Started:**  
**Completed:**  
**Merged to main:**  

#### What Was Built

**Files implemented (replaced TODO placeholders):**
- [ ] backend/src/utils/password.js — hashPassword, comparePassword
- [ ] backend/src/utils/jwt.js — generateAccessToken, generateRefreshToken, verifyAccessToken, verifyRefreshToken
- [ ] backend/src/validators/auth.validator.js — registerSchema, loginSchema (Zod)
- [ ] backend/src/middleware/validate.js — validate(schema) factory
- [ ] backend/src/middleware/auth.js — JWT verification, attaches req.user
- [ ] backend/src/middleware/roleGuard.js — requireRole(...roles) factory
- [ ] backend/src/middleware/errorHandler.js — Global error handler
- [ ] backend/src/middleware/rateLimiter.js — generalLimiter, authLimiter
- [ ] backend/src/models/user.model.js — createUser, findByEmail, findById, etc.
- [ ] backend/src/services/auth.service.js — register, login, refreshToken, getMe
- [ ] backend/src/controllers/auth.controller.js — Thin controller
- [ ] backend/src/routes/auth.routes.js — POST /register, /login, /refresh, GET /me

**Files modified:**
- [ ] backend/src/app.js — Mounted auth routes, rate limiters, error handler
- [ ] backend/src/db/seeds/seed_admin.sql — Real bcrypt hash for Admin@123

#### Verification Results

| Test | Pass/Fail | Notes |
|------|-----------|-------|
| POST /auth/register (valid) → 201 | | |
| POST /auth/register (duplicate email) → 409 | | |
| POST /auth/register (weak password) → 400 | | |
| POST /auth/login (valid) → 200 with tokens | | |
| POST /auth/login (wrong password) → 401 | | |
| POST /auth/login (non-existent email) → 401 | | |
| GET /auth/me (valid token) → 200 | | |
| GET /auth/me (no token) → 401 | | |
| GET /auth/me (expired token) → 401 | | |
| POST /auth/refresh (valid) → 200 | | |
| POST /auth/refresh (invalid) → 401 | | |
| No password_hash in any response | | |

#### Issues Encountered
_None yet._

#### Deviations from plan.md
_None yet._

---

### Sprint 2 — Auth Frontend + Landing Page

**Branch:** `varun/auth-ui-and-landing`  
**Status:** ⏳ Not started  
**Started:**  
**Completed:**  
**Merged to main:**  

#### What Was Built

**Files implemented:**
- [ ] frontend/src/stores/authStore.js — Complete with login, register, logout, checkAuth
- [ ] frontend/src/services/api.js — Updated with full interceptors (token attach + 401 refresh)
- [ ] frontend/src/components/common/ProtectedRoute.jsx
- [ ] frontend/src/components/common/LoadingSpinner.jsx
- [ ] frontend/src/components/common/Navbar.jsx
- [ ] frontend/src/components/common/Sidebar.jsx
- [ ] frontend/src/layouts/PublicLayout.jsx
- [ ] frontend/src/layouts/StudentLayout.jsx
- [ ] frontend/src/layouts/AdminLayout.jsx
- [ ] frontend/src/pages/auth/LandingPage.jsx
- [ ] frontend/src/pages/auth/LoginPage.jsx
- [ ] frontend/src/pages/auth/RegisterPage.jsx
- [ ] frontend/src/App.jsx — Updated with nested protected routes
- [ ] frontend/src/main.jsx — Added Toaster

#### Verification Results

| Test | Pass/Fail | Notes |
|------|-----------|-------|
| Landing page visually stunning (not generic AI) | | |
| Landing CTA buttons navigate correctly | | |
| Register form validates all fields inline | | |
| Register success → student dashboard | | |
| Login form validates | | |
| Login success → correct dashboard by role | | |
| Login as admin → admin layout + sidebar | | |
| Protected route redirects when not logged in | | |
| Student can't access /admin/* | | |
| Logout clears state + redirects | | |
| Token refresh works transparently | | |
| Responsive at 320px | | |
| Responsive at 768px | | |
| Responsive at 1024px | | |
| No console errors | | |

#### Design Quality Assessment

_Rate each 1-5 and note any specific issues:_
- Landing page design: /5
- Login page design: /5
- Register page design: /5
- Navbar design: /5
- Sidebar design: /5
- Typography (correct fonts used): /5
- Color consistency (CSS vars only): /5
- Animations (smooth, purposeful): /5

#### Issues Encountered
_None yet._

---

### Sprint 3 — Groups Backend

**Branch:** `varun/groups-api`  
**Status:** ⏳ Not started  
**Started:**  
**Completed:**  
**Merged to main:**  

#### What Was Built

- [ ] backend/src/validators/group.validator.js
- [ ] backend/src/models/group.model.js
- [ ] backend/src/services/group.service.js — All business logic with edge cases
- [ ] backend/src/controllers/group.controller.js
- [ ] backend/src/routes/group.routes.js
- [ ] backend/src/app.js — Mounted /api/v1/groups

#### Verification Results

| Test | Pass/Fail | Notes |
|------|-----------|-------|
| POST /groups → creates group, sets group_id | | |
| POST /groups when already in group → 400 | | |
| POST /groups/members (valid email) → adds | | |
| POST /groups/members (already in group) → 400 | | |
| POST /groups/members (group full) → 400 | | |
| POST /groups/members (not found) → 404 | | |
| DELETE /groups/members/:id → removes | | |
| DELETE /groups/members/:selfId → 400 | | |
| POST /groups/leave (non-leader) → leaves | | |
| POST /groups/leave (leader) → 400 | | |
| DELETE /groups (leader) → deletes, releases all | | |
| GET /groups/my-group → correct data | | |
| GET /groups (admin) → paginated list | | |
| GET /groups/:id (admin) → detail | | |
| Non-leader add/remove → 403 | | |
| DB transactions work (rollback on failure) | | |

#### Issues Encountered
_None yet._

---

### Sprint 4 — Groups Frontend

**Branch:** `varun/groups-ui`  
**Status:** ⏳ Not started  

_(Same structure — fill in after sprint)_

---

### Sprint 5 — Assignments Backend

**Branch:** `varun/assignments-api`  
**Status:** ⏳ Not started  

_(Same structure)_

---

### Sprint 6 — Assignments Frontend

**Branch:** `varun/assignments-ui`  
**Status:** ⏳ Not started  

_(Same structure)_

---

### Sprint 7 — Submissions Backend

**Branch:** `varun/submissions-api`  
**Status:** ⏳ Not started  

_(Same structure)_

---

### Sprint 8 — Submissions Frontend + Progress

**Branch:** `varun/submissions-and-progress-ui`  
**Status:** ⏳ Not started  

_(Same structure)_

---

### Sprint 9 — Dashboard Backend

**Branch:** `varun/dashboard-analytics-api`  
**Status:** ⏳ Not started  

_(Same structure)_

---

### Sprint 10 — Dashboard Frontend

**Branch:** `varun/dashboards`  
**Status:** ⏳ Not started  

_(Same structure)_

---

### Sprint 11 — UI Polish

**Branch:** `varun/ui-polish-pass`  
**Status:** ⏳ Not started  

_(Same structure — additionally include Design Quality Assessment for all pages)_

---

### Sprint 12 — Docker & Documentation

**Branch:** `varun/docker-and-docs`  
**Status:** ⏳ Not started  

_(Same structure — additionally include Docker verification: all 3 services start, frontend accessible, backend accessible, seed data works)_

---

### Sprint 13 — End-to-End QA

**Branch:** `varun/final-qa`  
**Status:** ⏳ Not started  

#### Bugs Found & Fixed

| # | Severity | Page/Endpoint | Description | Root Cause | Fix Applied | Verified |
|---|----------|---------------|-------------|------------|-------------|----------|
| | | | | | | |

#### Final Verification Matrix

| Category | Test | Pass |
|----------|------|------|
| **Auth** | Register works | |
| **Auth** | Login works (student + admin) | |
| **Auth** | Protected routes enforce roles | |
| **Auth** | Token refresh is transparent | |
| **Auth** | Logout clears everything | |
| **Groups** | Create group works | |
| **Groups** | Add/remove members works | |
| **Groups** | Leave group works | |
| **Groups** | Delete group releases members | |
| **Groups** | All edge cases handled | |
| **Assignments** | Admin CRUD works | |
| **Assignments** | Specific group assignment works | |
| **Assignments** | Student sees only assigned | |
| **Assignments** | Status badges correct | |
| **Submissions** | Two-step confirmation works | |
| **Submissions** | Cannot submit twice | |
| **Submissions** | Progress tracking accurate | |
| **Dashboard** | Student dashboard correct | |
| **Dashboard** | Admin summary correct | |
| **Dashboard** | Charts render with data | |
| **Dashboard** | Tooltips work | |
| **Responsive** | All pages at 320px | |
| **Responsive** | All pages at 768px | |
| **Responsive** | All pages at 1024px | |
| **Theme** | Dark mode all pages | |
| **Theme** | Light mode all pages | |
| **General** | Zero console errors | |
| **General** | All pages load < 3 seconds | |
| **Docker** | docker-compose up works | |
| **Docker** | Seed data populates correctly | |

---

## Architectural Decisions Log

> Record any decisions made during development that deviate from or clarify plan.md.

| Sprint | Decision | Reason |
|--------|----------|--------|
| | | |

---

## Known Limitations

> Things that are intentionally not built (scope control) or known issues accepted for now.

| Item | Reason |
|------|--------|
| No email verification on registration | Out of scope per plan.md |
| No password reset flow | Out of scope |
| No real-time updates (WebSockets) | Out of scope — data refreshes on page load |
| No file upload | By design — OneDrive handles files externally |
| Admin accounts are seeded only | By design per plan.md Section 3.3 Rule 10 |

---

## Test Account Credentials

_Populated after Sprint 12 seed data is created._

| Role | Email | Password | Notes |
|------|-------|----------|-------|
| Admin | admin@joineazy.com | Admin@123 | Seeded |
| Student 1 | student1@joineazy.com | Student@123 | In Alpha Squad |
| Student 2 | student2@joineazy.com | Student@123 | In Alpha Squad |
| ... | ... | ... | ... |

---

*Last updated: Project not yet started*
