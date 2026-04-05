# JoinEazy — Progress Tracker

> **Purpose:** This file is a living record of what has been built, what works, what broke, and what was learned. The agentic AI reads this file at the start of every sprint to understand the current state of the codebase and avoid re-doing work or breaking existing features.
>
> **Update rules:** After completing each sprint, fill in EVERY section — what was built (files created/modified), verification results (pass/fail each test), issues encountered (with details), and any architectural decisions or deviations from plan.md.

---

## Quick Status

| Sprint | Name | Branch | Status | Files Changed | Key Outcome |
|--------|------|--------|--------|---------------|-------------|
| 0 | Scaffolding | `varun/project-setup` | ⏳ Not started | — | — |
| 1 | Auth Backend | `varun/auth-backend` | ✅ Complete | 14 | JWT auth (register/login/refresh/me) live; admin login verified; all 12 tests green |
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
- **Server running:** Yes (port 5000, verified via `/api/v1/health`)
- **Database schema applied:** Yes (PostgreSQL running in Docker, admin seeded)
- **Working API endpoints:** `GET /api/v1/health`, `POST /api/v1/auth/register`, `POST /api/v1/auth/login`, `POST /api/v1/auth/refresh`, `GET /api/v1/auth/me`
- **Middleware implemented:** `validate`, `authMiddleware`, `requireRole`, `errorHandler`, `generalLimiter`, `authLimiter`
- **Models implemented:** `user.model.js` (createUser, findByEmail, findById, findByStudentId, emailExists, studentIdExists)
- **Services implemented:** `auth.service.js` (register, login, refreshToken, getMe)

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
**Status:** ✅ Complete  
**Started:** 2026-04-05  
**Completed:** 2026-04-05  
**Merged to main:**  

#### What Was Built

**Files implemented (replaced TODO placeholders):**
- [x] backend/src/utils/password.js — hashPassword, comparePassword (bcryptjs, 12 rounds)
- [x] backend/src/utils/jwt.js — generateAccessToken (15m), generateRefreshToken (7d), verifyAccessToken, verifyRefreshToken
- [x] backend/src/validators/auth.validator.js — registerSchema, loginSchema, refreshSchema (Zod; password regex enforces digit + special char; email trimmed/lowercased)
- [x] backend/src/middleware/validate.js — `validate(schema)` factory; replaces req.body with parsed data; forwards ZodError to global handler
- [x] backend/src/middleware/auth.js — `authMiddleware`; reads `Bearer` header, verifies access token, sets `req.user = { userId, email, role }`
- [x] backend/src/middleware/roleGuard.js — `requireRole(...roles)` factory (not yet mounted anywhere — ready for Sprint 3)
- [x] backend/src/middleware/errorHandler.js — Handles ZodError → 400 with per-field details, TokenExpiredError → 401 TOKEN_EXPIRED, JsonWebTokenError → 401 INVALID_TOKEN, service errors with `{statusCode, code}`, unknown → 500 INTERNAL_ERROR. Logs via Winston; never leaks stack.
- [x] backend/src/middleware/rateLimiter.js — generalLimiter (100/15min), authLimiter (20/15min)
- [x] backend/src/models/user.model.js — createUser, findByEmail (with hash, login only), findById, findByStudentId, emailExists, studentIdExists. All parameterized. Explicit column lists prevent hash leakage.
- [x] backend/src/services/auth.service.js — register (forces role='student'), login (generic INVALID_CREDENTIALS on both wrong-password and unknown-email), refreshToken (re-reads user from DB so role changes take effect), getMe. Uses `httpError(statusCode, code, message)` helper.
- [x] backend/src/controllers/auth.controller.js — Thin wrappers; every handler in try/catch; uses successResponse helper
- [x] backend/src/routes/auth.routes.js — POST /register, /login, /refresh (all behind `validate(...)`), GET /me (behind `authMiddleware`)

**Files modified:**
- [x] backend/src/app.js — Imports auth routes, rate limiters, error handler. Chain: helmet → cors → morgan → json → generalLimiter → health → `/api/v1/auth` (authLimiter + routes) → errorHandler (LAST).
- [ ] backend/src/db/seeds/seed_admin.sql — **Left untouched.** The existing bcrypt hash written in Sprint 0 was verified with `bcrypt.compare('Admin@123', hash)` → `true`. No rewrite needed; admin login test #4 confirmed it works end-to-end.

#### Verification Results

All tests performed against `npm start` backend on port 5000 with Dockerized PostgreSQL.

| Test | Pass/Fail | Notes |
|------|-----------|-------|
| POST /auth/register (valid) → 201 | ✅ Pass | Returns `{ user, accessToken, refreshToken }`; role forced to `student` even when payload tries to inject `role:'admin'` |
| POST /auth/register (duplicate email) → 409 | ✅ Pass | code `EMAIL_EXISTS` |
| POST /auth/register (weak password) → 400 | ✅ Pass | `VALIDATION_ERROR` with details `[{field:'password', message:'...digit'}, {field:'password', message:'...special character'}]` |
| POST /auth/login (valid) → 200 with tokens | ✅ Pass | Admin login returns role=`admin`, user row without hash |
| POST /auth/login (wrong password) → 401 | ✅ Pass | Generic `INVALID_CREDENTIALS` / "Invalid email or password" |
| POST /auth/login (non-existent email) → 401 | ✅ Pass | Same generic message — no user enumeration |
| GET /auth/me (valid token) → 200 | ✅ Pass | Returns `{ user }` without hash |
| GET /auth/me (no token) → 401 | ✅ Pass | `UNAUTHORIZED` / "Authentication required" |
| GET /auth/me (expired token) → 401 | ✅ Pass | `TOKEN_EXPIRED` (verified with a manually signed token using `expiresIn:'-1s'`) |
| POST /auth/refresh (valid) → 200 | ✅ Pass | Returns new `accessToken` |
| POST /auth/refresh (invalid) → 401 | ✅ Pass | `INVALID_TOKEN` on tampered/garbage refresh token |
| No password_hash in any response | ✅ Pass | grep of register, login, /me, refresh bodies — zero hits |

Additional sanity checks beyond the plan table:
- Tampered Bearer token (`abc.def.ghi`) → 401 `INVALID_TOKEN` ✅
- Register payload with injected `role:'admin'` → stored as `student` ✅
- Health check still reachable → 200 ✅

#### Issues Encountered

- **Windows Git-Bash path resolution for test scripts.** During test execution, a `node -e "require('/tmp/r4.json')"` trick failed because Node on Windows does not resolve `/tmp` the way curl (running in Git-Bash) does. Worked around by piping curl output straight through `python -c "import sys,json"` to extract tokens. Not a code issue — purely a test-harness quirk.

#### Deviations from plan.md

- **seed_admin.sql not rewritten.** Plan.md and the task spec both implied the sprint would hardcode a fresh bcrypt hash. Sprint 0 already wrote a valid bcrypt hash of `Admin@123` (`$2a$12$7Lgp70j2My/...`), which was verified programmatically. Replacing it would change the file for no behavioral reason and risk churning downstream sprints. Left in place after verification.
- **No logout endpoint added.** Plan.md Section 9.2 does not list `POST /auth/logout`, and stateless JWT has no server-side state to clear. Frontend logout is a pure client-side action (clear store + localStorage).

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
| 1 | Kept Sprint 0's existing bcrypt hash in `seed_admin.sql` instead of regenerating | Verified via `bcrypt.compare('Admin@123', hash) === true`; rewriting would churn the file for no behavioral gain |
| 1 | `refreshToken` service re-reads the user from DB instead of trusting the token's claims | Ensures role changes (future promotions/demotions) take effect on the next refresh rather than persisting stale claims for up to 7 days |
| 1 | Single generic `INVALID_CREDENTIALS` error for both wrong-password and unknown-email on login | Prevents user enumeration — standard security practice |
| 1 | `register` hardcodes `role='student'` regardless of payload | plan.md Rule 10: admins are seeded only. Defensive against payload injection. |

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

*Last updated: 2026-04-05 — Sprint 1 (Auth Backend) complete*
