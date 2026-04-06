# Groupd — Sprint Execution Guide

> **How to use this file**
>
> 1. Work through sprints in order. Each sprint has one focused scope.
> 2. Copy the **PROMPT** block into your agentic AI.
> 3. Run the **TEST** block to verify locally.
> 4. Run the **GIT** block to commit, push, and merge.
> 5. Update `progress.md` before moving on.

---

## Repository Initialization

```bash
git clone https://github.com/VarunPandrangi/groupd-task1.git
cd groupd-task1
```

Copy `plan.md`, `prompts.md`, and `progress.md` into the root, then:

```bash
git add plan.md prompts.md progress.md
git commit -m "docs: add project plan, sprint prompts, and progress tracker"
git push origin main
```

---

# Phase 0 — Foundation

---

## Sprint 0 · Backend Scaffolding & Database

**Scope:** Initialize the backend project, set up Express, configure PostgreSQL via Docker, write the full database migration, and seed the admin user. Nothing frontend.

**Branch:** `varun/backend-scaffold`

### PROMPT

```
ROLE:
You are a senior Node.js backend engineer.

CONTEXT:
Before writing anything, read `plan.md` in full. Pay close attention to:
- Section 8 (Data Architecture) — you will write the complete database schema from this.
- Section 11 (Backend Architecture) — you will create this exact folder structure.
- Section 9.1 (Response Format Standard) — you will implement these response helpers.
Then read `progress.md` — nothing exists yet. You are starting from scratch.

PROJECT SUMMARY:
Groupd is a role-based web app (React + Express + PostgreSQL + JWT). This sprint sets up the backend skeleton only.

TASK:
Initialize the backend/ directory as a Node.js project with everything configured but no business logic implemented.

1. INITIALIZE PROJECT
   - Create backend/ with package.json. Set "type": "module" for ES module syntax.
   - Install production deps: express, cors, helmet, morgan, dotenv, pg, bcryptjs, jsonwebtoken, zod, express-rate-limit, winston, uuid
   - Install dev dep: nodemon
   - Scripts: "start" → node src/server.js, "dev" → nodemon src/server.js

2. CREATE CONFIGURATION (backend/src/config/)
   - database.js — Create a PostgreSQL connection pool using the pg library. Read DATABASE_URL from process.env. Export the pool.
   - env.js — On import, check that these env vars exist: DATABASE_URL, JWT_SECRET, JWT_REFRESH_SECRET, PORT, CORS_ORIGIN. If any are missing, log the missing var name and throw an error so the server won't start with broken config.
   - cors.js — Export CORS options that read the allowed origin from CORS_ORIGIN env var.

3. CREATE UTILITIES (backend/src/utils/)
   - apiResponse.js — Two functions:
     successResponse(res, data, message, statusCode=200) → sends { success: true, data, message }
     errorResponse(res, message, code, statusCode=500, details=null) → sends { success: false, error: { code, message, details } }
   - logger.js — Winston logger with console transport, colorized, timestamps.

4. CREATE PLACEHOLDER FILES
   In each of these directories, create the files listed below. Each file should export nothing and contain only a comment: // Implemented in Sprint N (use the correct sprint number from plan.md Section 15).
   - middleware/: auth.js, roleGuard.js, validate.js, errorHandler.js, rateLimiter.js
   - routes/: auth.routes.js, group.routes.js, assignment.routes.js, submission.routes.js, dashboard.routes.js
   - controllers/: auth.controller.js, group.controller.js, assignment.controller.js, submission.controller.js, dashboard.controller.js
   - services/: auth.service.js, group.service.js, assignment.service.js, submission.service.js, dashboard.service.js
   - models/: user.model.js, group.model.js, assignment.model.js, submission.model.js, dashboard.model.js
   - validators/: auth.validator.js, group.validator.js, assignment.validator.js, submission.validator.js

5. CREATE DATABASE MIGRATION (backend/src/db/migrations/001_initial_schema.sql)
   Write the complete SQL schema from plan.md Section 8. This includes:
   - Enable pgcrypto extension for UUID generation
   - Create all 5 tables: groups, users, assignments, assignment_groups, submissions
   - All foreign keys, constraints, unique constraints, check constraints
   - All indexes listed in plan.md Section 8.3
   - Note: groups table must be created before users because users references groups(id). Then add the foreign key from groups.created_by → users.id via ALTER TABLE after both exist.

6. CREATE SEED FILE (backend/src/db/seeds/seed_admin.sql)
   Insert one admin user: full_name='Admin User', email='admin@groupd.com', role='admin', student_id=NULL.
   For the password_hash, use bcryptjs to generate a hash of 'Admin@123' with 12 salt rounds. Hardcode the resulting hash string in the SQL.
   Use ON CONFLICT (email) DO NOTHING for idempotency.

7. CREATE APP ENTRY POINT (backend/src/app.js)
   Set up Express with this middleware chain (in order):
   - helmet() for security headers
   - cors with config from cors.js
   - morgan('dev') for request logging
   - express.json() for body parsing
   - A health check route: GET /api/v1/health → returns { status: 'ok', timestamp: new Date().toISOString() }
   - Mount route files at: /api/v1/auth, /api/v1/groups, /api/v1/assignments, /api/v1/submissions, /api/v1/dashboard (they are stubs for now, so either mount them as empty routers or skip mounting until they have content — just make sure the app doesn't crash)
   - Do NOT add error handler middleware yet (it's a placeholder)
   Export the app.

8. CREATE SERVER (backend/src/server.js)
   Import env.js first (to validate env vars). Import app.js. Read PORT from env. Start listening. Log "Server running on port ${PORT}" with Winston.

9. CREATE .env.example
   DATABASE_URL=postgresql://groupd_user:groupd_pass@localhost:5432/groupd
   JWT_SECRET=change-this-to-a-random-secret-string
   JWT_REFRESH_SECRET=change-this-to-another-random-secret
   PORT=5000
   CORS_ORIGIN=http://localhost:5173
   NODE_ENV=development

10. CREATE DOCKER COMPOSE (at project root: docker-compose.yml)
    Single service: PostgreSQL 16 Alpine.
    - Container name: groupd-db
    - Env: POSTGRES_DB=groupd, POSTGRES_USER=groupd_user, POSTGRES_PASSWORD=groupd_pass
    - Port: 5432:5432
    - Volume: pgdata for data persistence
    - Mount: ./backend/src/db/migrations/ as /docker-entrypoint-initdb.d/ (so schema runs on first start)

11. CREATE .gitignore at project root
    node_modules/, .env, dist/, build/, .DS_Store, *.log, pgdata/

CONSTRAINTS:
- ES module syntax (import/export) everywhere. No require().
- Zero business logic. Only scaffolding and configuration.
- The server must start without crashing when .env is properly configured.
- Health endpoint must return a valid JSON response.
```

### TEST

```bash
# Start database
docker-compose up -d

# Verify tables were created
docker exec -it groupd-db psql -U groupd_user -d groupd -c "\dt"
# Should list: users, groups, assignments, assignment_groups, submissions

# Seed admin
docker exec -it groupd-db psql -U groupd_user -d groupd -f /docker-entrypoint-initdb.d/../seeds/seed_admin.sql
# OR from host:
cd backend
psql postgresql://groupd_user:groupd_pass@localhost:5432/groupd -f src/db/seeds/seed_admin.sql

# Start backend
cd backend
cp .env.example .env
npm install
npm run dev

# Test health endpoint
curl http://localhost:5000/api/v1/health
# Expected: {"status":"ok","timestamp":"..."}
```

### GIT

```bash
git checkout -b varun/backend-scaffold
git add .
git commit -m "chore: scaffold backend with Express, PostgreSQL schema, and Docker setup"
git push origin varun/backend-scaffold
# → Create PR on GitHub → Merge to main
git checkout main
git pull origin main
```

---

## Sprint 1 · Frontend Scaffolding & Design System

**Scope:** Initialize the React project, configure Tailwind, set up the design system (fonts, colors, CSS variables), configure routing with placeholders, and set up Axios. Nothing backend.

**Branch:** `varun/frontend-scaffold`

### PROMPT

```
ROLE:
You are a senior frontend engineer with strong design sensibility.

CONTEXT:
Read `plan.md` — focus on Section 10 (Frontend Architecture), Section 13 (UI/UX Design System — fonts, colors, responsive breakpoints).
Read `progress.md` — Sprint 0 is complete. Backend and Docker exist.

TASK:
Initialize the frontend/ directory as a Vite + React project with the complete design system and routing skeleton.

1. INITIALIZE PROJECT
   - Use Vite with the React template (JavaScript, not TypeScript): npm create vite@latest frontend -- --template react
   - Install deps: tailwindcss, @tailwindcss/vite, axios, react-router-dom, zustand, react-hot-toast, recharts, lucide-react, react-hook-form, @hookform/resolvers, zod
   - Configure @tailwindcss/vite plugin in vite.config.js
   - Set dev server port to 5173 in vite.config.js

2. DESIGN SYSTEM (frontend/src/styles/index.css)
   - Import Tailwind: @import "tailwindcss";
   - Import Google Fonts: Plus Jakarta Sans (weights 300–800), JetBrains Mono (weights 400–600)
   - Import Fontshare: Clash Display (weights 400–700)
   - Define CSS custom properties in :root for the dark theme (default):
     --bg-primary: #0F1117, --bg-secondary: #1A1D27, --bg-tertiary: #242836
     --accent-primary: #4F7BF7, --accent-secondary: #34D399, --accent-warning: #FBBF24, --accent-danger: #EF4444
     --text-primary: #F1F5F9, --text-secondary: #94A3B8, --text-tertiary: #64748B
     --border-default: #2A2F3E, --border-hover: #3B4252
     --font-display: 'Clash Display', sans-serif
     --font-body: 'Plus Jakarta Sans', sans-serif
     --font-mono: 'JetBrains Mono', monospace
   - Define [data-theme="light"] overrides as specified in plan.md Section 13.3
   - Base styles: body uses --font-body, --bg-primary background, --text-primary color, antialiased rendering. Headings use --font-display. Smooth scrolling on html.

3. FOLDER STRUCTURE
   Create all directories listed in plan.md Section 10.4:
   - src/components/common/
   - src/components/auth/
   - src/components/student/
   - src/components/admin/
   - src/pages/auth/
   - src/pages/student/
   - src/pages/admin/
   - src/stores/
   - src/services/
   - src/hooks/
   - src/utils/
   - src/layouts/
   - src/assets/

4. PLACEHOLDER COMPONENTS
   In src/components/common/, create these files. Each exports a simple functional component rendering a div with the component name as text: Navbar.jsx, Sidebar.jsx, ProtectedRoute.jsx, LoadingSpinner.jsx, EmptyState.jsx, StatusBadge.jsx, Modal.jsx, ConfirmDialog.jsx

5. AXIOS INSTANCE (src/services/api.js)
   Create a fully configured Axios instance:
   - baseURL from import.meta.env.VITE_API_URL
   - Request interceptor: reads the current access token (will come from auth store — for now import the store but handle gracefully if token is null)
   - Response interceptor stub: catch 401 errors, log "Token refresh needed" to console (full refresh logic comes in Sprint 3)
   - Export the instance as default

6. AUTH STORE SKELETON (src/stores/authStore.js)
   Create a Zustand store with empty/null initial state:
   - user: null, accessToken: null, isAuthenticated: false, isLoading: true
   - Empty action stubs with TODO comments: login, register, logout, checkAuth, setAccessToken

7. LAYOUT SKELETONS (src/layouts/)
   - PublicLayout.jsx — renders <Outlet /> from react-router-dom
   - StudentLayout.jsx — renders <Outlet />
   - AdminLayout.jsx — renders <Outlet />
   (These will be properly built in Sprint 4 with navbar and sidebar.)

8. PLACEHOLDER PAGES
   For each route in plan.md Section 10.2, create a minimal page component that renders a styled div with the page name centered (use the CSS variables for styling). Files:
   - pages/auth/LandingPage.jsx, LoginPage.jsx, RegisterPage.jsx
   - pages/student/StudentDashboard.jsx, AssignmentList.jsx, AssignmentDetail.jsx, GroupManagement.jsx, CreateGroup.jsx, GroupProgress.jsx
   - pages/admin/AdminDashboard.jsx, AssignmentManager.jsx, CreateAssignment.jsx, EditAssignment.jsx, GroupViewer.jsx, GroupDetail.jsx, SubmissionTracker.jsx

9. ROUTING (src/App.jsx)
   Set up React Router v6 with all routes from plan.md Section 10.2. Use nested routes:
   - Public routes inside PublicLayout: /, /login, /register
   - Student routes inside StudentLayout: /student/dashboard, /student/assignments, /student/assignments/:id, /student/group, /student/group/create, /student/progress
   - Admin routes inside AdminLayout: /admin/dashboard, /admin/assignments, /admin/assignments/new, /admin/assignments/:id, /admin/groups, /admin/groups/:id, /admin/submissions
   - A catch-all * route showing "404 — Page Not Found"
   (Protection comes in Sprint 4. For now all routes are public so we can verify they resolve.)

10. ENTRY POINT (src/main.jsx)
    Import index.css. Render App inside BrowserRouter.

11. ENV FILE (frontend/.env)
    VITE_API_URL=http://localhost:5000/api/v1

CONSTRAINTS:
- Zero Tailwind color classes directly (no bg-blue-500). All colors via CSS vars: bg-[var(--bg-primary)].
- ES module syntax.
- No TypeScript.
- Every route must resolve without errors.
- Zero console errors on startup.
```

### TEST

```bash
cd frontend
npm install
npm run dev

# Open browser and verify each route:
# http://localhost:5173/            → "LandingPage"
# http://localhost:5173/login       → "LoginPage"
# http://localhost:5173/register    → "RegisterPage"
# http://localhost:5173/student/dashboard → "StudentDashboard"
# http://localhost:5173/admin/dashboard   → "AdminDashboard"
# http://localhost:5173/xyz         → "404"

# Check browser console → zero errors
# Check that fonts loaded (inspect body → Plus Jakarta Sans)
# Check that background color is #0F1117 (dark theme)
```

### GIT

```bash
git checkout -b varun/frontend-scaffold
git add .
git commit -m "chore: scaffold frontend with Vite, Tailwind, routing, and design system"
git push origin varun/frontend-scaffold
# → PR → Merge
git checkout main
git pull origin main
```

---

# Phase 1 — Authentication

---

## Sprint 2 · Auth Backend — Middleware & Endpoints

**Scope:** Implement all backend auth logic: password hashing, JWT utilities, Zod validators, all middleware (auth, role guard, validation, error handler, rate limiter), user model, auth service, controller, and routes. Only auth. No other modules.

**Branch:** `varun/auth-backend`

### PROMPT

```
ROLE:
You are a senior backend engineer specializing in secure authentication systems.

CONTEXT:
Read `plan.md` — focus on:
- Section 5.1 FR-AUTH (all 7 requirements)
- Section 6.1 stories S-01 and S-02 (every acceptance criterion)
- Section 8.2 (users table description)
- Section 9.2 Auth Module endpoints
- Section 12 (Authentication & Security Design — token architecture, password policy)
- Section 14 (Authentication edge cases)

Read `progress.md` — Sprints 0–1 complete. Backend scaffold exists with placeholder files. PostgreSQL is running with schema applied.

Read these existing files before coding:
- backend/src/app.js
- backend/src/config/database.js
- backend/src/utils/apiResponse.js
- backend/src/utils/logger.js

TASK:
Implement the complete authentication backend. Replace every placeholder file with working code.

WHAT TO BUILD:

utils/password.js
- hashPassword(plaintext) → bcrypt hash with 12 salt rounds
- comparePassword(plaintext, hash) → boolean

utils/jwt.js
- generateAccessToken({ userId, email, role }) → signed JWT, expires 15 min, uses JWT_SECRET
- generateRefreshToken({ userId, email, role }) → signed JWT, expires 7 days, uses JWT_REFRESH_SECRET
- verifyAccessToken(token) → decoded payload or throws
- verifyRefreshToken(token) → decoded payload or throws

validators/auth.validator.js (Zod)
- registerSchema: full_name (string, 2–100 chars, trimmed), email (valid email, lowercased), student_id (string, 3–50 chars), password (min 8 chars, must have 1+ digit, 1+ special char via regex)
- loginSchema: email (valid email, lowercased), password (string, min 1 char)

middleware/validate.js
- validate(schema) → factory returning middleware that validates req.body. On fail: 400 with formatted Zod errors.

middleware/auth.js
- Reads Authorization header. Expects "Bearer <token>". Verifies access token. Sets req.user = { userId, email, role }. On fail: 401.

middleware/roleGuard.js
- requireRole(...roles) → middleware that checks req.user.role is in the list. On fail: 403.

middleware/errorHandler.js
- Catches all errors. Handles known types: ZodError → 400, JsonWebTokenError → 401, TokenExpiredError → 401. Unknown → 500 with generic message. Logs via Winston. Never exposes stack traces.

middleware/rateLimiter.js
- generalLimiter: 100 requests per 15 min per IP
- authLimiter: 20 requests per 15 min per IP

models/user.model.js
- createUser({ full_name, email, student_id, password_hash, role }) → INSERT, return user WITHOUT password_hash
- findByEmail(email) → SELECT with password_hash (needed for login comparison)
- findById(id) → SELECT without password_hash
- findByStudentId(student_id) → SELECT
- emailExists(email) → boolean
- studentIdExists(student_id) → boolean
- All queries parameterized ($1, $2)

services/auth.service.js
- register({ full_name, email, student_id, password }) → check email unique (409) → check student_id unique (409) → hash password → create user as 'student' → generate tokens → return { user, accessToken, refreshToken }
- login({ email, password }) → find by email (401 "Invalid email or password") → compare password (401 same message) → generate tokens → return { user, accessToken, refreshToken }
- refreshToken(token) → verify refresh token (401) → find user (401) → generate new access token → return { accessToken }
- getMe(userId) → find by id → return user

controllers/auth.controller.js
- register → 201, login → 200, refresh → 200, getMe → 200. All wrapped in try/catch, errors to next().

routes/auth.routes.js
- POST /register → validate(registerSchema) → controller.register
- POST /login → validate(loginSchema) → controller.login
- POST /refresh → controller.refresh
- GET /me → auth middleware → controller.getMe

Update app.js:
- Mount auth routes at /api/v1/auth
- Apply authLimiter to /api/v1/auth
- Apply generalLimiter globally
- Add errorHandler as the LAST middleware

Update db/seeds/seed_admin.sql:
- Generate a real bcrypt hash of 'Admin@123' with 12 rounds. Hardcode it in the INSERT.

CONSTRAINTS:
- Never return password_hash in responses.
- All DB queries parameterized.
- ES module syntax, async/await.
- Use apiResponse helpers for ALL responses.
```

### TEST

```bash
# PostgreSQL running
docker-compose up -d

# Seed admin
cd backend
psql postgresql://groupd_user:groupd_pass@localhost:5432/groupd -f src/db/seeds/seed_admin.sql

# Start server
npm run dev

# Register
curl -s -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"full_name":"Test User","email":"test@example.com","student_id":"STU001","password":"Pass@1234"}'

# Duplicate → 409
curl -s -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"full_name":"Duplicate","email":"test@example.com","student_id":"STU002","password":"Pass@1234"}'

# Weak password → 400
curl -s -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"full_name":"Weak","email":"weak@example.com","student_id":"STU003","password":"short"}'

# Login
curl -s -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Pass@1234"}'

# Wrong password → 401
curl -s -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"wrong"}'

# Get me (use token from login response)
curl -s http://localhost:5000/api/v1/auth/me \
  -H "Authorization: Bearer <PASTE_TOKEN_HERE>"

# No token → 401
curl -s http://localhost:5000/api/v1/auth/me

# Admin login
curl -s -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@groupd.com","password":"Admin@123"}'
```

### GIT

```bash
git checkout -b varun/auth-backend
git add .
git commit -m "feat: implement auth backend — register, login, JWT, middleware"
git push origin varun/auth-backend
# → PR → Merge
git checkout main
git pull origin main
```

---

## Sprint 3 · Auth Pages — Landing, Login, Register

**Scope:** Build the three public-facing pages: landing page, login, register. Also implement the auth Zustand store and Axios interceptors. Nothing about layouts, sidebars, or protected routes — those come next sprint.

**Branch:** `varun/auth-pages`

### PROMPT

```
ROLE:
You are a world-class frontend engineer and visual designer. You create interfaces that look human-designed, never AI-generated.

CONTEXT:
Read `plan.md` — focus on:
- Section 6.1 stories S-01 and S-02 (acceptance criteria)
- Section 12.2 (Frontend Token Flow — how tokens are stored and refreshed)
- Section 13 (UI/UX Design System — EVERY subsection: typography, colors, animations)

Read `progress.md` — Sprints 0–2 complete. Frontend scaffold exists with placeholder pages. Backend auth API is running.

Read these existing files:
- frontend/src/services/api.js (you will update this)
- frontend/src/stores/authStore.js (you will implement this)
- frontend/src/styles/index.css (CSS variables — use these for ALL colors)
- frontend/src/pages/auth/ (placeholder files you will replace)

TASK:
Build three pages and the auth infrastructure. This sprint does NOT include layouts, sidebars, or protected routing — only the pages and auth logic.

1. AUTH STORE (src/stores/authStore.js)
   Implement the full Zustand store:
   - State: user (null), accessToken (null), isAuthenticated (false), isLoading (true)
   - login(email, password): POST /auth/login → store user + accessToken in state, refreshToken in localStorage → return user
   - register(data): POST /auth/register → store same way → return user
   - logout(): clear state, remove refreshToken from localStorage
   - setAccessToken(token): update accessToken in state
   - checkAuth(): if refreshToken exists in localStorage, call POST /auth/refresh → if success, get new accessToken, then call GET /auth/me → set user + isAuthenticated. If anything fails, call logout(). Set isLoading to false at end.

2. AXIOS INTERCEPTORS (update src/services/api.js)
   Request interceptor: get accessToken from authStore.getState(). If exists, set Authorization: Bearer <token> header.
   Response interceptor: on 401 error, attempt refresh — get refreshToken from localStorage, call POST /auth/refresh, if success: update store with new accessToken, retry the original request. If refresh fails: call logout(), redirect to /login using window.location.

3. LANDING PAGE (src/pages/auth/LandingPage.jsx)
   A visually stunning, dark-themed landing page:
   - Hero section with a large heading. One example: "Collaborate. Submit. Succeed." Use Clash Display. Apply a gradient text effect (linear-gradient clipped to text) on one word using the accent colors.
   - Subheading in --text-secondary, 1-2 lines explaining the product.
   - Two CTA buttons side by side: "Get Started" (solid fill, --accent-primary, links to /register) and "Sign In" (outlined border, links to /login).
   - Background: NOT a plain flat color. Add a subtle CSS effect — either a geometric dot grid pattern, a radial gradient glow, or a noise texture using CSS.
   - Three feature cards below hero with Lucide icons: Groups (Users icon), Assignments (FileText), Progress (BarChart3). Each card has an icon, title, short description. Cards have --bg-secondary background with --border-default border.
   - Simple footer: "Built for Groupd" centered in --text-tertiary.
   - Animations: elements stagger in on page load. Use CSS @keyframes fadeInUp with increasing animation-delay for each element.

4. LOGIN PAGE (src/pages/auth/LoginPage.jsx)
   - Dark background (--bg-primary). Centered card (--bg-secondary) with max-width ~420px.
   - "Welcome back" heading in Clash Display. Subtle subtext.
   - Form with react-hook-form + Zod: Email input, Password input.
   - Custom input styling: --bg-tertiary background, --border-default border, --text-primary text. On focus: border transitions to --accent-primary with a subtle box-shadow glow.
   - Inline validation errors below each field in --accent-danger.
   - Submit button: full width, --accent-primary bg, loading spinner inside button during API call, disabled while loading.
   - Below form: "Don't have an account? Sign up" — link to /register.
   - On success: store tokens, navigate to /student/dashboard or /admin/dashboard based on user.role. Use react-router's useNavigate.
   - On error: show toast notification (react-hot-toast) with the error message.

5. REGISTER PAGE (src/pages/auth/RegisterPage.jsx)
   Same visual quality and structure as login. Fields:
   - Full Name (2–100 chars)
   - Email (valid email)
   - Student ID (3–50 chars)
   - Password (8+ chars, 1 digit, 1 special char)
   - Confirm Password (must match)
   Zod schema with .refine() for password match. Same input styling, inline errors, loading button.
   On success: auto-login (store tokens), navigate to /student/dashboard.
   Link: "Already have an account? Sign in" → /login.

6. UPDATE main.jsx
   Add Toaster from react-hot-toast with styling that matches the dark theme:
   - Background: --bg-tertiary
   - Text: --text-primary
   - Position: top-right

DESIGN RULES (CRITICAL):
- All colors via CSS variables only. NEVER use bg-blue-500 or text-gray-300 or any Tailwind color class.
- Heading font: font-[family-name:var(--font-display)] or apply via className that references the CSS.
- Landing page must NOT look like a generic AI template. No purple gradients. No rounded blob shapes. Think Linear.app or Vercel's aesthetic.
- Inputs must feel premium — focus transitions, subtle glow, clean spacing.
- Buttons must have hover (slight scale + shadow change), active (scale down), disabled (opacity) states.
```

### TEST

```bash
# Backend running
cd backend && npm run dev &

# Frontend
cd frontend && npm run dev

# In browser:
# 1. http://localhost:5173/ → Landing loads, animations play, buttons link correctly
# 2. Click "Get Started" → Register page
# 3. Submit empty form → Inline validation errors on every field
# 4. Enter mismatched passwords → "Passwords must match" error
# 5. Fill correctly, submit → Redirects to /student/dashboard (placeholder page)
# 6. Open /login → Login page
# 7. Enter wrong password → Toast error "Invalid email or password"
# 8. Enter correct credentials → Redirects to dashboard
# 9. Check that design feels premium, not generic
# 10. Console → zero errors

kill %1
```

### GIT

```bash
git checkout -b varun/auth-pages
git add .
git commit -m "feat: build landing page, login, and register with auth store and Axios interceptors"
git push origin varun/auth-pages
# → PR → Merge
git checkout main
git pull origin main
```

---

## Sprint 4 · App Shell — Navbar, Sidebar, Layouts, Protected Routes

**Scope:** Build the navigation infrastructure: Navbar, collapsible Sidebar, all three Layouts wired properly, and the ProtectedRoute component with role-based access. No page content — just the app shell.

**Branch:** `varun/app-shell`

### PROMPT

```
ROLE:
You are a frontend engineer building navigation systems with precise interaction design.

CONTEXT:
Read `plan.md` — Section 10.2 (Route Map), Section 10.4 (Component Organization), Section 12.4 (Authorization Matrix — who can access what), Section 13 (Design System — sidebar, navbar, responsive guidelines).
Read `progress.md` — Sprints 0–3 complete. Auth pages work. Landing/Login/Register are styled.

Read these files:
- frontend/src/stores/authStore.js (you'll read isAuthenticated, user.role from here)
- frontend/src/App.jsx (you'll restructure routing)
- frontend/src/styles/index.css (CSS vars)

TASK:
Build the structural components that wrap all pages.

1. NAVBAR (src/components/common/Navbar.jsx)
   Fixed top bar. Height 64px. Background: --bg-secondary with opacity ~0.8 and backdrop-filter: blur(12px). Subtle bottom border (--border-default).
   - Left: "Groupd" text logo in Clash Display font. Make the "E" in Eazy a different color (--accent-primary) as a brand touch.
   - Right (logged out): "Login" and "Register" buttons (links to /login and /register).
   - Right (logged in): user's full_name, role badge (small pill — "Student" in --accent-primary or "Admin" in --accent-warning), and a Logout button (LogOut icon from Lucide). On logout: call authStore.logout() and navigate to /login.
   - Responsive: on mobile, right side items could be in a simple row or dropdown.

2. SIDEBAR (src/components/common/Sidebar.jsx)
   Reusable. Props: navItems (array of { label, path, icon }).
   - Fixed left, below the navbar. Full remaining height.
   - Two modes: expanded (icon + text, ~240px wide) and collapsed (icon only, ~72px). Toggle via a chevron button at the bottom.
   - Each item: Lucide icon + label text. Clicking navigates (use NavLink from react-router).
   - Active item detection: match current path → active item gets a left border bar in --accent-primary and slightly brighter text/bg.
   - Background: --bg-secondary. Border-right: --border-default.
   - Smooth width transition: transition-all duration-300.
   - Persist collapsed/expanded preference in localStorage.

3. LAYOUTS
   PublicLayout (src/layouts/PublicLayout.jsx):
   - Navbar at top
   - Outlet below, full width, no sidebar

   StudentLayout (src/layouts/StudentLayout.jsx):
   - Navbar at top
   - Sidebar on left with items: Dashboard (LayoutDashboard icon, /student/dashboard), Assignments (FileText, /student/assignments), My Group (Users, /student/group), Progress (BarChart3, /student/progress)
   - Outlet to the right of sidebar, properly spaced (margin-left matching sidebar width, transition with sidebar collapse)

   AdminLayout (src/layouts/AdminLayout.jsx):
   - Same structure as StudentLayout
   - Different sidebar items: Dashboard (LayoutDashboard, /admin/dashboard), Assignments (FileText, /admin/assignments), Groups (Users, /admin/groups), Submissions (ClipboardCheck, /admin/submissions)

4. PROTECTED ROUTE (src/components/common/ProtectedRoute.jsx)
   Props: allowedRoles (array of strings).
   - On mount: if authStore.isLoading is true, show a full-page LoadingSpinner.
   - If isLoading is false and isAuthenticated is false: redirect to /login.
   - If isAuthenticated but user.role is not in allowedRoles: redirect to the user's own dashboard (/student/dashboard for students, /admin/dashboard for admins).
   - If all checks pass: render <Outlet />.

5. LOADING SPINNER (src/components/common/LoadingSpinner.jsx)
   A clean, animated spinner using CSS animation. Circle or dots in --accent-primary. Centered on page. Used by ProtectedRoute and anywhere loading is needed.

6. UPDATE App.jsx
   Restructure routes with proper nesting:
   - / → PublicLayout → LandingPage (public)
   - /login → PublicLayout → LoginPage (public)
   - /register → PublicLayout → RegisterPage (public)
   - /student/* → ProtectedRoute(allowedRoles=['student']) → StudentLayout → student pages
   - /admin/* → ProtectedRoute(allowedRoles=['admin']) → AdminLayout → admin pages
   - * → 404 page

   On app mount (in App.jsx or a wrapper): call authStore.checkAuth() to attempt session restoration from stored refresh token.

CONSTRAINTS:
- All colors via CSS variables.
- Sidebar transition must be smooth (no jumps).
- Active nav item clearly distinguishable.
- Content area must not go under the sidebar (proper spacing).
- On mobile (< 768px): sidebar hidden by default, accessible via hamburger or just hidden entirely for now.
```

### TEST

```bash
cd backend && npm run dev &
cd frontend && npm run dev

# 1. Not logged in → visit /student/dashboard → redirected to /login
# 2. Login as student → see Navbar (name + "Student" badge) + Sidebar (Dashboard, Assignments, My Group, Progress)
# 3. Click sidebar items → each navigates, active item highlighted
# 4. Toggle sidebar collapse → animates smoothly, content area adjusts
# 5. Refresh page → session restored (not kicked to login)
# 6. Logout → redirected to /login, navbar shows Login/Register buttons
# 7. Login as admin → see admin sidebar items (Dashboard, Assignments, Groups, Submissions)
# 8. As admin, visit /student/dashboard → redirected to /admin/dashboard
# 9. Resize to mobile → sidebar hides or collapses
# 10. Console → zero errors

kill %1
```

### GIT

```bash
git checkout -b varun/app-shell
git add .
git commit -m "feat: build app shell — navbar, collapsible sidebar, layouts, protected routes"
git push origin varun/app-shell
# → PR → Merge
git checkout main
git pull origin main
```

---

# Phase 2 — Group Management

---

## Sprint 5 · Groups Backend

**Scope:** Implement all group backend endpoints: create, add member, remove member, leave, delete, get my group, admin list, admin detail. Business logic and edge cases only for groups.

**Branch:** `varun/groups-api`

### PROMPT

```
ROLE:
You are a senior backend engineer specializing in transactional data operations.

CONTEXT:
Read `plan.md` — focus on:
- Section 3.3 (Domain Rules 1–3 about groups)
- Section 5.1 (FR-GROUP — all 10 requirements)
- Section 6.1 (Stories S-03 through S-06 — every acceptance criterion)
- Section 8 (users and groups tables, their FK relationship)
- Section 9.2 (Groups Module — all 8 endpoints)
- Section 14 (Edge Cases — Groups — EVERY one must be handled)

Read `progress.md` — Sprints 0–4 complete.

Follow the exact same coding patterns established in the auth module:
- backend/src/models/user.model.js (query pattern)
- backend/src/services/auth.service.js (error throwing pattern)
- backend/src/controllers/auth.controller.js (controller pattern)
- backend/src/routes/auth.routes.js (route wiring pattern)

TASK:
Build the complete groups module.

validators/group.validator.js — Zod schemas:
- createGroupSchema: name (3–50 chars, trimmed, regex: letters, numbers, spaces, hyphens only), description (max 200 chars, optional)
- addMemberSchema: email (valid email, optional), student_id (string, optional), with a .refine() ensuring at least one is provided

models/group.model.js — Parameterized SQL:
- createGroup({ name, description, created_by }) → INSERT, return group
- findById(id), findByName(name), nameExists(name) → boolean
- getGroupMembers(groupId) → SELECT id, full_name, email, student_id FROM users WHERE group_id = $1
- getAllGroups(page, limit) → paginated list with member count via subquery, return groups + pagination meta
- deleteGroup(groupId) → DELETE FROM groups

services/group.service.js — Heavy business logic:
- createGroup(userId, { name, description }):
  → user already has group_id? → 400
  → name taken? → 409
  → BEGIN TRANSACTION → INSERT group → UPDATE user SET group_id = group.id → COMMIT
  → return group with members
- addMember(leaderId, { email, student_id }):
  → get leader's group → verify leader is groups.created_by (403 if not)
  → find target by email or student_id (404 if not found)
  → target is admin? → 400
  → target already in a group? → 400
  → group has 6 members? → 400
  → UPDATE target SET group_id → return updated members
- removeMember(leaderId, targetUserId):
  → verify leader → target is leader themselves? → 400 → target in this group? → 404 → SET group_id NULL
- leaveGroup(userId):
  → user has no group? → 400 → user is leader? → 400 → SET group_id NULL → if group now empty, delete it
- deleteGroup(leaderId):
  → verify leader → BEGIN TRANSACTION → SET all members' group_id NULL → DELETE group → COMMIT
- getMyGroup(userId): return group with members or null
- getAllGroups(page, limit): admin, paginated
- getGroupDetail(groupId): admin, group with members

controllers/group.controller.js — Thin. Extract from req, call service, respond.

routes/group.routes.js — Wire endpoints per plan.md Section 9.2.
- Student routes: auth middleware only
- Admin routes (GET /, GET /:groupId): auth + requireRole('admin')

Mount in app.js at /api/v1/groups.

CRITICAL:
- Use database transactions (BEGIN/COMMIT/ROLLBACK) for createGroup and deleteGroup.
- Every edge case from plan.md Section 14 Groups must return the correct HTTP status and message.
```

### TEST

```bash
docker-compose up -d
cd backend && npm run dev

# Register test students
for i in 1 2 3 4 5 6 7; do
  curl -s -X POST http://localhost:5000/api/v1/auth/register \
    -H "Content-Type: application/json" \
    -d "{\"full_name\":\"Student $i\",\"email\":\"s$i@test.com\",\"student_id\":\"S00$i\",\"password\":\"Test@1234\"}" > /dev/null
done

# Login as student 1
TOKEN=$(curl -s -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"s1@test.com","password":"Test@1234"}' | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['accessToken'])")

# Create group
curl -s -X POST http://localhost:5000/api/v1/groups \
  -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"Alpha Squad","description":"Best team"}'

# Add member
curl -s -X POST http://localhost:5000/api/v1/groups/members \
  -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d '{"email":"s2@test.com"}'

# Get my group
curl -s http://localhost:5000/api/v1/groups/my-group -H "Authorization: Bearer $TOKEN"

# Try creating another group while in one → 400
curl -s -X POST http://localhost:5000/api/v1/groups \
  -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"Second"}'

# Admin list groups
ADMIN=$(curl -s -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@groupd.com","password":"Admin@123"}' | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['accessToken'])")
curl -s http://localhost:5000/api/v1/groups -H "Authorization: Bearer $ADMIN"
```

### GIT

```bash
git checkout -b varun/groups-api
git add .
git commit -m "feat: implement group management backend — CRUD, member ops, edge cases"
git push origin varun/groups-api
# → PR → Merge
git checkout main
git pull origin main
```

---

## Sprint 6 · Groups Frontend

**Scope:** Build the group management UI for students (create, add/remove members, leave, delete) and group viewer for admins. Includes ConfirmDialog and EmptyState shared components.

**Branch:** `varun/groups-ui`

### PROMPT

```
ROLE:
You are a frontend engineer building polished, interaction-rich UI.

CONTEXT:
Read `plan.md` — Section 6.1 (Stories S-03 to S-06, every criterion), Section 13 (Design System), Section 14 (Groups edge cases — user sees these as error toasts).
Read `progress.md` — Sprints 0–5 complete. App shell (navbar, sidebar, layouts, protected routes) works. Backend group API is live.

Follow existing patterns from:
- frontend/src/stores/authStore.js (Zustand)
- frontend/src/pages/auth/LoginPage.jsx (forms, toasts, error handling)
- frontend/src/components/common/Navbar.jsx (component structure)

TASK:
Build the group management frontend.

SHARED COMPONENTS:
- components/common/ConfirmDialog.jsx — Reusable confirmation modal. Props: isOpen, title, message, confirmText, cancelText, onConfirm, onCancel, variant ('danger'|'default'). Dark backdrop with blur. Centered card with smooth scale animation. Danger variant: red confirm button. Render via React portal (document.getElementById('modal-root') — add a <div id="modal-root"></div> in index.html).
- components/common/EmptyState.jsx — Props: icon (Lucide component), title, message, actionLabel?, onAction?. Centered vertically and horizontally. Large icon in --text-tertiary. Title in Clash Display. Message in --text-secondary. Optional CTA button.

STORE:
- stores/groupStore.js — state: group, members, isLoading. Actions: fetchMyGroup (GET /groups/my-group), createGroup (POST /groups), addMember (POST /groups/members), removeMember (DELETE /groups/members/:id), leaveGroup (POST /groups/leave), deleteGroup (DELETE /groups).
- services/groupService.js — API wrappers. Include admin: getAllGroups(page, limit), getGroupDetail(id).

STUDENT PAGES:
- pages/student/GroupManagement.jsx:
  On mount, call fetchMyGroup.
  IF no group → EmptyState with Users icon, "You're not in a group yet", CTA "Create a Group" → navigates to /student/group/create.
  IF has group:
    Group header: name (Clash Display, large), description, "Created on [date]", member count badge.
    Member list (grid on desktop, stack on mobile): cards with initials avatar circle (first letter of name, colored bg), full name, email in mono font, student_id. Leader has a gold "Leader" badge.
    If user is leader:
      "Add Member" button → reveals inline form below it (slides down). Input (email or student ID) + "Add" button. On success: toast + member appears. On error: toast with API error message.
      Each member card (except self) has a trash icon button. Click → ConfirmDialog "Remove [name] from the group?" → on confirm, remove.
      Danger zone at bottom (separated by border): "Delete Group" button (red). ConfirmDialog → on confirm, delete → UI resets to empty state.
    If user is NOT leader:
      "Leave Group" button. ConfirmDialog → on confirm, leave → empty state.

- pages/student/CreateGroup.jsx:
  Centered form. Name input (required, 3–50 chars), Description textarea (optional). Validation with react-hook-form + Zod. Submit → toast success → navigate to /student/group.

ADMIN PAGES:
- pages/admin/GroupViewer.jsx: Table of all groups — columns: Name, Leader, Members, Created. Clickable rows → /admin/groups/:id. Pagination. Styled like a professional data table.
- pages/admin/GroupDetail.jsx: Header with group info. Table of members (Name, Email, Student ID, Role). Back button.

CONSTRAINTS:
- Toast for every action (success + error).
- ConfirmDialog for every destructive action.
- Loading spinners during API calls.
- Responsive: cards stack on mobile.
```

### TEST

```bash
cd backend && npm run dev &
cd frontend && npm run dev

# In browser:
# 1. Login as student → My Group → Empty state → Create Group → Fill form → Submit
# 2. See group with yourself as leader
# 3. Add member (enter email of another registered student) → Appears
# 4. Add non-existent email → Error toast
# 5. Remove member → Confirm → Gone
# 6. Login as non-leader → See "Leave Group" → Confirm → Empty state
# 7. Login as leader → Delete Group → Confirm → Empty state
# 8. Login as admin → Groups → Table → Click row → Detail page
# 9. Mobile width → check layout

kill %1
```

### GIT

```bash
git checkout -b varun/groups-ui
git add .
git commit -m "feat: build group management UI — create, members, leave, delete, admin views"
git push origin varun/groups-ui
# → PR → Merge
git checkout main
git pull origin main
```

---

# Phase 3 — Assignments

---

## Sprint 7 · Assignments Backend

**Scope:** Assignment CRUD, group-specific assignment via junction table, status computation. Backend only.

**Branch:** `varun/assignments-api`

### PROMPT

```
ROLE:
You are a senior backend engineer.

CONTEXT:
Read `plan.md` — Section 5.1 FR-ASSIGN, Section 6 (stories S-07, S-08, A-02, A-03, A-04), Section 8 (assignments + assignment_groups tables), Section 8.5 (status computation), Section 9.2 Assignments Module, Section 14 Assignments edge cases.
Read `progress.md` — Sprints 0–6 complete.
Follow patterns from backend/src/services/group.service.js and backend/src/models/group.model.js.

TASK:
Build complete assignment management backend.

validators/assignment.validator.js:
- createAssignmentSchema: title (3–100 chars), description (max 2000, optional), due_date (ISO string, must parse to valid future Date), onedrive_link (valid URL starting with http(s)://), assign_to (enum 'all'|'specific'), group_ids (array of UUID strings, required when assign_to='specific', min 1 item, using Zod .refine())
- updateAssignmentSchema: all fields optional (Zod .partial())

models/assignment.model.js:
- create, findById (where is_deleted=false), update (dynamic fields), softDelete (SET is_deleted=true)
- getAll(page, limit) — paginated, exclude deleted, sorted by due_date ASC
- getForStudent(userId) — get assignments where assign_to='all' OR user's group is in assignment_groups. Join through users.group_id. Exclude deleted.
- addGroups(assignmentId, groupIds[]) — bulk INSERT assignment_groups
- removeGroups(assignmentId) — DELETE all junction records for assignment
- getAssignmentGroups(assignmentId) — return groups linked to assignment

services/assignment.service.js:
- create: insert assignment → if specific, validate all groupIds exist (400 if any don't) → insert junction records → return with groups
- update: find (404 if not found/deleted) → update fields → handle assign_to change (specific→all: remove junctions, all→specific or specific→specific: replace junctions) → return
- softDelete: find → mark deleted
- getAll: paginated, add computed status per plan.md Section 8.5
- getForStudent: filtered, add status + student's submission status for each
- getDetail: if admin → include all submissions; if student → include own submission status

controllers/assignment.controller.js: dispatch based on role for getAll.
routes/assignment.routes.js: per plan.md. Admin-only for POST, PUT, DELETE. Both roles for GET.
Mount at /api/v1/assignments.
```

### TEST

```bash
docker-compose up -d
cd backend && npm run dev

ADMIN=$(curl -s -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@groupd.com","password":"Admin@123"}' | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['accessToken'])")

# Create assignment (all)
curl -s -X POST http://localhost:5000/api/v1/assignments \
  -H "Content-Type: application/json" -H "Authorization: Bearer $ADMIN" \
  -d '{"title":"Week 1 Report","description":"First report","due_date":"2026-04-25T23:59:00Z","onedrive_link":"https://onedrive.live.com/1","assign_to":"all"}'

# List as admin
curl -s http://localhost:5000/api/v1/assignments -H "Authorization: Bearer $ADMIN"

# List as student
TOKEN=$(curl -s -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"s1@groupd.com","password":"Student@123"}' | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['accessToken'])")
curl -s http://localhost:5000/api/v1/assignments -H "Authorization: Bearer $TOKEN"

# Past due date → 400
curl -s -X POST http://localhost:5000/api/v1/assignments \
  -H "Content-Type: application/json" -H "Authorization: Bearer $ADMIN" \
  -d '{"title":"Old","description":"x","due_date":"2020-01-01T00:00:00Z","onedrive_link":"https://x.com","assign_to":"all"}'
```

### GIT

```bash
git checkout -b varun/assignments-api
git add .
git commit -m "feat: implement assignment CRUD backend with group assignment and status logic"
git push origin varun/assignments-api
# → PR → Merge
git checkout main
git pull origin main
```

---

## Sprint 8 · Assignments Frontend

**Scope:** Student assignment list (cards + filters), assignment detail page, admin assignment table, create/edit forms. Frontend only.

**Branch:** `varun/assignments-ui`

### PROMPT

```
ROLE:
You are a frontend engineer building clean data-driven interfaces.

CONTEXT:
Read `plan.md` — Section 6 (stories S-07, S-08, A-02, A-03, A-04), Section 13 (Design System).
Read `progress.md` — Sprints 0–7 complete.
Follow patterns from frontend/src/pages/student/GroupManagement.jsx and frontend/src/stores/groupStore.js.

TASK:
Build complete assignment UI for students and admin.

STORE + SERVICE:
- stores/assignmentStore.js: assignments[], currentAssignment, isLoading. Actions: fetchAssignments(), fetchAssignment(id), createAssignment(data), updateAssignment(id, data), deleteAssignment(id).
- services/assignmentService.js: API wrappers for all assignment endpoints.

SHARED COMPONENT:
- components/common/StatusBadge.jsx: Props: status string. Pill badge. upcoming → --accent-primary bg at 20% opacity + text. active → --accent-warning. overdue → --accent-danger. confirmed → --accent-secondary. pending → --text-tertiary. Small uppercase text.

STUDENT PAGES:
- pages/student/AssignmentList.jsx: Filter tabs at top (All | Upcoming | Active | Overdue). Grid of cards below. Each card: title (Clash Display), description (2-line clamp), due date (JetBrains Mono), StatusBadge. Click → /student/assignments/:id. Empty state if none. Sorted nearest due first.
- pages/student/AssignmentDetail.jsx: Full title, description, due date with relative time ("in 3 days"), StatusBadge. Prominent "Open Submission Link" button (accent-primary, ExternalLink icon, opens OneDrive URL in new tab). Submission section: show styled placeholder text "Submission controls coming next sprint." (This gets replaced in Sprint 10.) Back button.

ADMIN PAGES:
- pages/admin/AssignmentManager.jsx: "Create Assignment" button at top → /admin/assignments/new. Table: Title, Due Date, Status, Assign To, Actions (edit icon → /admin/assignments/:id, delete icon → ConfirmDialog → soft delete). Pagination.
- pages/admin/CreateAssignment.jsx: Form with react-hook-form + Zod. Fields: Title, Description (textarea), Due Date (native date input), OneDrive Link, Assign To (radio: "All Groups" | "Specific Groups"). When "Specific" selected: fetch groups from admin API, show checkboxes in a scrollable container. On submit → toast + redirect to /admin/assignments.
- pages/admin/EditAssignment.jsx: Same form, pre-filled. Fetch assignment on mount. On save → toast + redirect.

CONSTRAINTS:
- Dates displayed in a human-friendly format (e.g., "Apr 25, 2026" not raw ISO).
- Cards: --bg-secondary bg, --border-default border, hover elevates with shadow.
- Tables: alternating row bg, hover highlight, sticky header.
- All colors via CSS vars.
```

### TEST

```bash
cd backend && npm run dev &
cd frontend && npm run dev

# 1. Admin → Assignments → Create Assignment → Fill form → Submit → Appears in table
# 2. Create another with "Specific Groups" → Select groups → Submit
# 3. Edit assignment → Pre-filled → Change title → Save → Updated
# 4. Delete → Confirm → Removed from table
# 5. Student → Assignments → See assigned cards → Filters work
# 6. Click card → Detail page → OneDrive link opens in new tab
# 7. Back button works
# 8. Mobile responsive

kill %1
```

### GIT

```bash
git checkout -b varun/assignments-ui
git add .
git commit -m "feat: build assignment UI — student cards, admin CRUD, filters, status badges"
git push origin varun/assignments-ui
# → PR → Merge
git checkout main
git pull origin main
```

---

# Phase 4 — Submissions

---

## Sprint 9 · Submissions Backend

**Scope:** Submission confirmation endpoint, my-submissions query, admin submission query, group progress query. Backend only.

**Branch:** `varun/submissions-api`

### PROMPT

```
ROLE:
You are a backend engineer building audit-critical confirmation systems.

CONTEXT:
Read `plan.md` — Section 3.3 (Domain Rules 4–6), Section 5.1 FR-SUBMIT, Section 6.1 (Story S-09), Section 8 (submissions table, unique constraint), Section 9.2 Submissions Module, Section 14 Submissions edge cases.
Read `progress.md` — Sprints 0–8 complete.

TASK:
Build the submission confirmation backend.

validators/submission.validator.js:
- confirmSubmissionSchema: assignment_id (string, valid UUID format)

models/submission.model.js:
- create({ assignment_id, student_id, group_id }) → INSERT, return with confirmed_at
- findByAssignmentAndStudent(assignmentId, studentId) → for duplicate check
- getByAssignment(assignmentId) → JOIN users for student details + group name
- getByStudent(studentId) → JOIN assignments for titles
- getGroupProgress(groupId) → For each assignment assigned to this group: count how many of the group's members have submitted vs total members. Return array: { assignment_id, title, due_date, submitted_count, total_members, is_complete }

services/submission.service.js:
- confirmSubmission(userId, assignmentId):
  → get user → has group_id? (400 if not)
  → get assignment → exists and not deleted? (404)
  → assignment assigned to user's group? (if assign_to='specific', check junction table; if 'all', always ok) (403 if not)
  → already submitted? (409)
  → INSERT submission → return
- getMySubmissions(userId) → all this student's submissions
- getSubmissionsByAssignment(assignmentId) → admin, all submissions with student details
- getGroupProgress(userId) → get user's group, compute progress

controllers + routes per plan.md. Mount at /api/v1/submissions.
```

### TEST

```bash
docker-compose up -d
cd backend && npm run dev

TOKEN=$(curl -s -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"s1@groupd.com","password":"Student@123"}' | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['accessToken'])")

# Get an assignment ID
ASSIGNMENT_ID=$(curl -s http://localhost:5000/api/v1/assignments \
  -H "Authorization: Bearer $TOKEN" | python3 -c "import sys,json; print(json.load(sys.stdin)['data'][0]['id'])")

# Submit
curl -s -X POST http://localhost:5000/api/v1/submissions \
  -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d "{\"assignment_id\":\"$ASSIGNMENT_ID\"}"

# Double submit → 409
curl -s -X POST http://localhost:5000/api/v1/submissions \
  -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d "{\"assignment_id\":\"$ASSIGNMENT_ID\"}"

# My submissions
curl -s http://localhost:5000/api/v1/submissions/my-submissions -H "Authorization: Bearer $TOKEN"

# Group progress
curl -s http://localhost:5000/api/v1/submissions/group-progress -H "Authorization: Bearer $TOKEN"
```

### GIT

```bash
git checkout -b varun/submissions-api
git add .
git commit -m "feat: implement submission confirmation backend with progress tracking"
git push origin varun/submissions-api
# → PR → Merge
git checkout main
git pull origin main
```

---

## Sprint 10 · Submissions Frontend + Progress Page

**Scope:** Two-step submission confirmation on assignment detail page, group progress page with progress bars and badges.

**Branch:** `varun/submissions-ui`

### PROMPT

```
ROLE:
You are a frontend engineer specializing in interaction design and data visualization.

CONTEXT:
Read `plan.md` — Section 6.1 (Stories S-09 and S-10 — every criterion), Section 13 (animations, progress bars).
Read `progress.md` — Sprints 0–9 complete.

Read these files:
- frontend/src/pages/student/AssignmentDetail.jsx (you will replace the submission placeholder)
- frontend/src/components/common/ConfirmDialog.jsx (you will use this)

TASK:
Build submission confirmation UI and progress tracking.

STORE + SERVICE:
- stores/submissionStore.js: mySubmissions[], groupProgress[], isLoading. Actions: confirmSubmission(assignmentId), fetchMySubmissions(), fetchGroupProgress().
- services/submissionService.js: API wrappers.

COMPONENTS:
- components/student/ProgressBar.jsx: Props: current, total, showLabel (bool), size ('sm'|'md'|'lg'). Animated width from 0 to target% on mount (CSS transition, 800ms ease-out). Color: --accent-secondary if 100%, --accent-warning if >0%, --text-tertiary if 0%. Optional "X/Y" label.
- components/student/CompletionBadge.jsx: Props: status ('complete'|'in-progress'|'not-started'). Pill badge. Complete → green + CheckCircle. In Progress → amber + Clock. Not Started → gray + Circle.

UPDATE pages/student/AssignmentDetail.jsx:
Remove placeholder. Add:
- If NOT submitted: "Mark as Submitted" button (large, --accent-primary). On click → ConfirmDialog with title "Confirm Submission", message "Have you uploaded your work to OneDrive? This action cannot be undone.", confirmText "Yes, I have submitted". On confirm → API call → success toast → button becomes submitted state.
- If ALREADY submitted: green "Submitted ✓" text with confirmed_at timestamp in JetBrains Mono. No button.
- "Group Status" section below: each member's name with CheckCircle (green, submitted) or Clock (muted, pending) icon.

BUILD pages/student/GroupProgress.jsx:
- If no group → EmptyState.
- Overall: "X of Y assignments completed" + large ProgressBar.
- Grid of cards: each shows assignment title, due date, StatusBadge, ProgressBar (submitted/total members), CompletionBadge. Sorted: incomplete first.

UPDATE pages/student/AssignmentList.jsx:
Fetch mySubmissions on mount. On each assignment card, show a small green CheckCircle icon if the student has submitted that assignment.
```

### TEST

```bash
cd backend && npm run dev &
cd frontend && npm run dev

# 1. Student → Assignment → Detail → See "Mark as Submitted"
# 2. Click → Modal → Cancel → Nothing happens
# 3. Click again → Modal → "Yes, I have submitted" → Success toast → Shows "Submitted ✓ at [time]"
# 4. Refresh → Still shows submitted
# 5. Back to list → Green checkmark on submitted card
# 6. Progress page → Progress bars visible → Correct numbers
# 7. Login as another group member → Submit same assignment → Progress updates
# 8. Responsive check

kill %1
```

### GIT

```bash
git checkout -b varun/submissions-ui
git add .
git commit -m "feat: build two-step submission confirmation and group progress tracking"
git push origin varun/submissions-ui
# → PR → Merge
git checkout main
git pull origin main
```

---

# Phase 5 — Dashboard & Analytics

---

## Sprint 11 · Dashboard Backend

**Scope:** Analytical endpoints for student and admin dashboards. Efficient aggregate SQL queries. Backend only.

**Branch:** `varun/dashboard-api`

### PROMPT

```
ROLE:
You are a backend engineer specializing in analytical SQL queries.

CONTEXT:
Read `plan.md` — Section 5.1 FR-DASH, Section 6 (stories S-11, A-07), Section 9.2 Dashboard Module.
Read `progress.md` — Sprints 0–10 complete. Re-read Section 8 for table relationships.

TASK:
Build dashboard analytics endpoints.

models/dashboard.model.js:
- getStudentDashboard(userId): Return user's group (with members), pending assignments (assigned but not submitted by this user), completed count, total count, next 5 upcoming deadlines.
- getAdminSummary(): total students, total groups, total active assignments, overall completion rate. Completion rate = total submissions / total expected × 100. "Expected" per assignment: if all → students with groups; if specific → students in assigned groups.
- getAssignmentAnalytics(): per assignment: id, title, due_date, status, confirmed_count, total_expected, completion_rate. Efficient SQL using GROUP BY and subqueries.
- getGroupAnalytics(): per group: id, name, member_count, total_assignments, completed_assignments (ALL members submitted), completion_rate.

CRITICAL: Efficient SQL. Use JOINs, GROUP BY, aggregate functions, subqueries or CTEs. NO N+1 (no looping in JS with one query per item).

services/dashboard.service.js, controllers/dashboard.controller.js, routes/dashboard.routes.js.
Mount at /api/v1/dashboard. Admin endpoints require requireRole('admin').
```

### TEST

```bash
docker-compose up -d
cd backend && npm run dev

TOKEN=$(curl -s -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"s1@groupd.com","password":"Student@123"}' | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['accessToken'])")

curl -s http://localhost:5000/api/v1/dashboard/student -H "Authorization: Bearer $TOKEN" | python3 -m json.tool

ADMIN=$(curl -s -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@groupd.com","password":"Admin@123"}' | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['accessToken'])")

curl -s http://localhost:5000/api/v1/dashboard/admin/summary -H "Authorization: Bearer $ADMIN" | python3 -m json.tool
curl -s http://localhost:5000/api/v1/dashboard/admin/assignments-analytics -H "Authorization: Bearer $ADMIN" | python3 -m json.tool
curl -s http://localhost:5000/api/v1/dashboard/admin/groups-analytics -H "Authorization: Bearer $ADMIN" | python3 -m json.tool
```

### GIT

```bash
git checkout -b varun/dashboard-api
git add .
git commit -m "feat: implement dashboard analytics backend with aggregate queries"
git push origin varun/dashboard-api
# → PR → Merge
git checkout main
git pull origin main
```

---

## Sprint 12 · Dashboard Frontend

**Scope:** Student dashboard page and admin analytics dashboard with Recharts charts.

**Branch:** `varun/dashboards`

### PROMPT

```
ROLE:
You are a frontend engineer and data visualization expert. You build dashboards that feel like premium analytics products.

CONTEXT:
Read `plan.md` — Section 6 (stories S-11, A-07), Section 13 (chart theming, summary cards, animations).
Read `progress.md` — Sprints 0–11 complete.

TASK:
Build both dashboards.

COMPONENTS:
- components/common/AnimatedCounter.jsx: Props: target (number), duration (default 1000ms). Counts from 0 to target with ease-out easing using requestAnimationFrame. Returns the current animated number.
- components/admin/SummaryCard.jsx: Props: title, value, icon, color. Card with --bg-secondary bg, subtle top border in the color prop (gradient). Icon at top with slight opacity. Value displayed large in Clash Display using AnimatedCounter. Title in --text-secondary below.

PAGES:
- pages/student/StudentDashboard.jsx (data from GET /dashboard/student):
  "Welcome back, {name}" (Clash Display).
  If no group → CTA card "Create or join a group to get started" with button.
  If has group → group info card (name, members, "Manage →" link).
  Stats row: 3 cards — Total Assignments (FileText icon), Completed (CheckCircle, green), Pending (Clock, amber). Use AnimatedCounter for numbers.
  Upcoming Deadlines: list of next 5 assignments (title, due date, StatusBadge). Clickable → assignment detail.
  Overall ProgressBar with "View Progress →" link.

- pages/admin/AdminDashboard.jsx (data from 3 admin endpoints):
  4 SummaryCards: Total Students (Users), Total Groups (UsersRound), Active Assignments (FileText), Completion Rate (TrendingUp, show as %).
  Assignment Completion Chart: Recharts BarChart. X = titles (truncated), Y = completion % (0–100). Custom bars: green >75%, amber 25–75%, red <25%. Rounded top corners. Custom dark tooltip.
  Group Performance Chart: Recharts BarChart. Each group: green bar (completed) + gray bar (remaining). Sorted by completion.
  Quick Actions: "Create Assignment", "View Groups", "Track Submissions" buttons.

- pages/admin/SubmissionTracker.jsx:
  Dropdown to select an assignment. On select: fetch submissions + groups. Display table: Group Name → Members listed with Confirmed ✓ or Pending status. Color-coded badges.

CHART THEMING:
- Background transparent.
- Grid lines: --border-default.
- Axis text: --text-tertiary.
- Custom tooltip: --bg-tertiary bg, --border-default border, --text-primary text.
- Bar animations on mount.

Add loading skeletons (pulse rectangles matching layout) to both dashboards while data loads.
```

### TEST

```bash
cd backend && npm run dev &
cd frontend && npm run dev

# 1. Student → Dashboard → Stats, deadlines, progress visible
# 2. No-group student → CTA card
# 3. Admin → Dashboard → 4 summary cards with counting animation
# 4. Charts render with real data → Hover bars for tooltips
# 5. Quick action buttons navigate correctly
# 6. Submission Tracker → Select assignment → See statuses
# 7. Throttle network → See loading skeletons
# 8. Responsive check

kill %1
```

### GIT

```bash
git checkout -b varun/dashboards
git add .
git commit -m "feat: build student and admin dashboards with Recharts analytics"
git push origin varun/dashboards
# → PR → Merge
git checkout main
git pull origin main
```

---

# Phase 6 — Polish & Delivery

---

## Sprint 13 · UI Polish & Responsive Pass

**Scope:** Theme toggle, loading skeletons on all pages, empty states audit, error boundary, responsive fixes, animation consistency, favicon. No new features — only refinement.

**Branch:** `varun/polish`

### PROMPT

```
ROLE:
You are a perfectionist UI engineer doing the final quality pass.

CONTEXT:
Read `plan.md` Section 13 entirely — this is your bible.
Read `progress.md` — Sprints 0–12 complete. All features built.
Read through the ENTIRE frontend codebase to understand every page.

TASK:
Polish pass. No new features. Only refinement, consistency, and edge cases.

1. THEME TOGGLE: Sun/Moon button in Navbar. Toggles data-theme="light" on <html>. Persist in localStorage. Add CSS transition (300ms) for background-color, color, border-color on body and all major elements.

2. SKELETON LOADER: Create components/common/Skeleton.jsx — a reusable pulse-animated placeholder. Variants: 'text', 'card', 'circle', 'chart'. Add skeletons to every page that fetches data (both dashboards, assignment list, group page, progress page, admin tables).

3. EMPTY STATES: Audit every page. Ensure: assignment list (no assignments), group page (no group), progress (no group), admin groups (no groups), admin submissions (no submissions), dashboards (no data). Each with appropriate icon, message, CTA.

4. ERROR BOUNDARY: components/common/ErrorBoundary.jsx — React class component. On error: render "Something went wrong" with Reload button. Wrap App.

5. RESPONSIVE: Test every page at 320px, 768px, 1024px. Fix: sidebar hidden on mobile, tables scroll, forms full-width, charts resize, cards stack. Navbar hamburger on mobile if needed.

6. ANIMATION CONSISTENCY: Every page fades in on mount. Every card hovers with translateY(-2px). Every button has hover/active/disabled states. Focus-visible outlines. scroll-behavior: smooth.

7. FAVICON: SVG favicon — stylized "J" in --accent-primary. Update index.html: title "Groupd", meta description.

8. CLEANUP: Remove all console.log. Remove unused imports. Verify all headings use Clash Display, all body uses Plus Jakarta Sans, all data uses JetBrains Mono. Grep for hardcoded hex colors and replace with CSS vars.
```

### TEST

```bash
cd backend && npm run dev &
cd frontend && npm run dev

# 1. Toggle theme → dark ↔ light → both look good → refresh → persists
# 2. Throttle network → skeletons visible on all pages
# 3. Fresh DB → empty states everywhere
# 4. Console → zero errors, zero warnings
# 5. Test at 320px, 768px, 1024px, 1280px
# 6. Tab through UI → focus outlines visible
# 7. Favicon in browser tab

kill %1
```

### GIT

```bash
git checkout -b varun/polish
git add .
git commit -m "feat: polish UI — theme toggle, skeletons, responsive, animations, consistency"
git push origin varun/polish
# → PR → Merge
git checkout main
git pull origin main
```

---

## Sprint 14 · Docker Production + Seed Data + README

**Scope:** Dockerize the full stack, create comprehensive seed data, write the README. No code changes to features.

**Branch:** `varun/docker-and-docs`

### PROMPT

```
ROLE:
You are a DevOps engineer and technical writer.

CONTEXT:
Read `plan.md` — Section 16 (Deployment Architecture), Section 17 (Deliverables Checklist).
Read `progress.md` — Sprints 0–13 complete.

TASK:

1. BACKEND DOCKERFILE (backend/Dockerfile):
   Node.js 20 Alpine. WORKDIR /app. Copy package files, npm ci --only=production. Copy source. EXPOSE 5000. CMD ["node", "src/server.js"].

2. FRONTEND DOCKERFILE (frontend/Dockerfile):
   Multi-stage. Build stage: Node.js 20 Alpine, install, build (ARG VITE_API_URL). Serve stage: Nginx Alpine, copy dist, copy nginx.conf. EXPOSE 3000.

3. NGINX CONFIG (frontend/nginx.conf):
   Listen 3000. Root /usr/share/nginx/html. SPA routing: try_files $uri $uri/ /index.html. Gzip on.

4. UPDATE docker-compose.yml:
   Three services:
   - postgres: image postgres:16-alpine, healthcheck (pg_isready), volume, port 5432
   - backend: build ./backend, depends_on postgres (condition: service_healthy), port 5000, env vars for DB/JWT/CORS
   - frontend: build ./frontend, depends_on backend, port 3000, build arg VITE_API_URL=http://localhost:5000/api/v1

5. SEED DATA SCRIPT (backend/src/db/seeds/seed_data.js):
   Node.js script. Connects to DATABASE_URL. TRUNCATE all tables CASCADE. Insert:
   - 1 admin (admin@groupd.com / Admin@123)
   - 10 students (student1–10@groupd.com / Student@123)
   - 3 groups: "Alpha Squad" (students 1–4), "Beta Force" (5–7), "Gamma Wave" (8–10)
   - 5 assignments: 2 "all", 2 "specific", 1 overdue (past due date)
   - Scattered submissions for dashboard chart data
   Add "seed" script to package.json: "seed": "node src/db/seeds/seed_data.js"

6. README.md:
   Comprehensive. Sections: Overview, Features, Tech Stack, Architecture, Database ER (Mermaid), API Endpoints, Getting Started (Docker + local dev), Seed Data, Project Structure, Design Decisions.
```

### TEST

```bash
# Full Docker test
docker-compose down -v
docker-compose up --build -d
docker-compose logs -f  # Wait for all services healthy

# Seed data
cd backend && npm run seed

# Verify
# http://localhost:3000 → Frontend loads
# http://localhost:5000/api/v1/health → Backend responds
# Login: admin@groupd.com / Admin@123 → Dashboard with charts
# Login: student1@groupd.com / Student@123 → Dashboard with data
```

### GIT

```bash
git checkout -b varun/docker-and-docs
git add .
git commit -m "feat: dockerize full stack, add seed data, write comprehensive README"
git push origin varun/docker-and-docs
# → PR → Merge
git checkout main
git pull origin main
```

---

## Sprint 15 · End-to-End QA

**Scope:** Systematic testing of every user flow, every edge case, every screen size, every theme. Fix all bugs found.

**Branch:** `varun/final-qa`

### PROMPT

```
ROLE:
You are a meticulous QA engineer.

CONTEXT:
Read `plan.md` Section 14 (every edge case) and Section 6 (every acceptance criterion).
Read `progress.md` — Sprints 0–14 complete.

TASK:
Execute every test below. Fix every issue found. Then re-test.

SETUP: docker-compose down -v → docker-compose up --build -d → npm run seed

AUTH:
- Landing page loads with animations
- Register → success → dashboard
- Register duplicate email → 409 toast
- Register weak password → inline errors
- Login → correct dashboard by role
- Login wrong password → error toast
- Protected routes enforce roles
- Logout clears everything
- Token refresh works

GROUPS:
- No group → empty state
- Create → appears → add members → works
- Non-existent email → error
- Already-in-group → error
- Full group → error
- Remove member → confirm → removed
- Leave → confirm → empty state
- Delete → confirm → releases all

ASSIGNMENTS:
- Admin creates (all + specific) → works
- Edit → pre-filled → saves
- Delete → confirm → gone
- Student sees only assigned
- Filters (All/Upcoming/Active/Overdue) work
- OneDrive opens in new tab

SUBMISSIONS:
- Mark as Submitted → modal → confirm → recorded
- Already submitted → button disabled
- Progress page accurate

DASHBOARDS:
- Student stats correct
- Admin charts render with data and tooltips
- Submission tracker works

RESPONSIVE: 375px, 768px, 1024px — every page.
THEME: Dark ↔ light — every page readable, charts adapt.
CONSOLE: Zero errors. Zero warnings.

Fix all bugs. Update progress.md with bugs found and fixed. Mark project COMPLETE.
```

### TEST

```bash
docker-compose down -v
docker-compose up --build -d
cd backend && npm run seed

# Run through every test in the prompt above manually in browser
# Fix any issues found
# Re-test after fixes
```

### GIT

```bash
git checkout -b varun/final-qa
git add .
git commit -m "fix: final QA — resolve edge cases, responsive issues, and polish"
git push origin varun/final-qa
# → PR → Merge
git checkout main
git pull origin main

# Tag release
git tag v1.0.0
git push origin v1.0.0
```

---

# Final Verification

```bash
docker-compose down -v
docker-compose up --build -d
cd backend && npm run seed

# admin@groupd.com / Admin@123 → Charts, groups, submissions visible
# student1@groupd.com / Student@123 → Group, assignments, progress visible
# All features work. Both themes. All screen sizes. Zero console errors.
```

You're done. Ship it.
