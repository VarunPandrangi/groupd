# Groupd — Project Plan & Specification Document

> **Purpose of this document:** This is the single source of truth for the entire Groupd project. Every decision, every feature, every edge case lives here. The agentic AI building this project must read this document before every sprint to understand WHY we are building what we are building, WHAT the system must do, and HOW it should behave. This is not a code document — it is a planning, specification, and architectural reference.

---

## Table of Contents

1. [Project Identity](#1-project-identity)
2. [Problem Statement](#2-problem-statement)
3. [Problem Context & Domain Analysis](#3-problem-context--domain-analysis)
4. [Stakeholders & Users](#4-stakeholders--users)
5. [Software Requirements Specification (SRS)](#5-software-requirements-specification-srs)
6. [User Stories & Acceptance Criteria](#6-user-stories--acceptance-criteria)
7. [Software Design Specification (SDS)](#7-software-design-specification-sds)
8. [Data Architecture](#8-data-architecture)
9. [API Contract](#9-api-contract)
10. [Frontend Architecture](#10-frontend-architecture)
11. [Backend Architecture](#11-backend-architecture)
12. [Authentication & Security Design](#12-authentication--security-design)
13. [UI/UX Design System](#13-uiux-design-system)
14. [Edge Cases & Business Rules](#14-edge-cases--business-rules)
15. [Agile Plan — Epics, Phases & Sprints](#15-agile-plan--epics-phases--sprints)
16. [Deployment Architecture](#16-deployment-architecture)
17. [Deliverables Checklist](#17-deliverables-checklist)
18. [Glossary](#18-glossary)

---

## 1. Project Identity

| Field | Value |
|-------|-------|
| **Project Name** | Groupd — Student Group & Assignment Management System |
| **Repository** | https://github.com/VarunPandrangi/groupd-task1.git |
| **Tech Stack** | React.js, Tailwind CSS, Node.js, Express.js, PostgreSQL, Docker |
| **Authentication** | JWT-based with role separation (Student / Admin) |
| **Developer** | Varun Pandrangi |
| **Development Method** | Agile — Sprints with feature branches, PRs, and merges |

---

## 2. Problem Statement

In collaborative academic environments, professors assign group-based work to students. Currently, there is no unified platform that lets students self-organize into groups AND lets professors track whether those groups have actually completed and submitted their work.

**The gap:** Professors post assignment links (OneDrive) through scattered channels (email, LMS, WhatsApp). Students form groups informally with no digital record. When submission time comes, professors have zero visibility into who submitted, which groups are complete, and who is falling behind.

**Groupd fills this gap** by providing a clean, role-based platform where students form groups, view assignments, confirm submissions through a deliberate two-step process, and track their group's progress — while professors get a real-time dashboard with analytics on completion rates and group performance.

---

## 3. Problem Context & Domain Analysis

### 3.1 The Current Pain Points

**For Students:**
- Group formation happens over WhatsApp and verbal agreements — there is no single record of who is in which group.
- Assignment links get buried in email threads and LMS notifications. Students miss deadlines because they lose track.
- There is no way for a student to see their group's collective progress across all assignments.

**For Professors:**
- After posting an assignment with a OneDrive link, professors have zero way to confirm who actually submitted.
- Tracking group-wise progress requires manual spreadsheets that go stale immediately.
- There is no bird's-eye view of class performance — which groups are ahead, which are struggling, what is the overall completion rate.

### 3.2 What Groupd Solves

| Pain Point | Groupd Solution |
|------------|-------------------|
| Informal group formation | Students create digital groups, add members by email/ID, with enforced constraints (max 6, one group per student) |
| Scattered assignment links | Centralized assignment board with clear status indicators (upcoming, active, overdue) |
| No submission verification | Two-step confirmation process: "Mark as Submitted" → "Are you sure?" → timestamped record |
| No progress visibility | Visual progress bars, completion badges, per-assignment and per-group tracking |
| No analytics for professors | Dashboard with summary cards, completion charts, group performance comparison |

### 3.3 Key Domain Rules

These are the non-negotiable business rules that define how the system operates:

1. **One group per student.** A student cannot be in two groups simultaneously.
2. **Groups have a leader.** The student who creates the group is the leader. Only the leader can add/remove members.
3. **Max 6 members per group.** This is an enforced constraint.
4. **Submission is a group-level confirmation, not individual.** When any member of a group confirms submission for an assignment, the entire group is marked as submitted. The system records WHICH member triggered the confirmation (submitted_by) and WHEN (confirmed_at). Students upload their work to OneDrive externally — Groupd only records the confirmation.
5. **Two-step confirmation.** To prevent accidental confirmations, the confirming student must confirm twice (button click → modal) before the group's submission is recorded.
6. **Submissions are irreversible.** Once a group's submission is confirmed, it cannot be undone. This ensures audit integrity.
7. **Assignments can be assigned to all groups or specific groups.** The "all" option assigns to every group that exists. The "specific" option lets professors pick individual groups.
8. **Soft delete for assignments.** Deleted assignments are hidden but retained in the database for audit purposes.
9. **Late submissions are allowed.** Students can confirm after the due date. The timestamp will show it was late, but the system does not block it.
10. **Admins are seeded, not self-registered.** Only students can register through the UI. Admin accounts are created via seed data.

---

## 4. Stakeholders & Users

### 4.1 User Personas

**Persona 1: Riya (Student)**
- 2nd-year undergraduate
- Needs to form a group with 3 classmates
- Checks assignments weekly, submits work via OneDrive
- Wants to see if her groupmates have also confirmed submission
- Frustrated when she can't track deadlines in one place

**Persona 2: Prof. Sharma (Admin / Professor)**
- Teaches 3 courses, ~120 students total
- Posts 10+ assignments per semester
- Needs to track which groups confirmed submission for each assignment
- Wants a dashboard with completion rates so he can follow up with lagging groups
- Currently tracks everything in a spreadsheet that goes stale immediately

### 4.2 User Roles

| Role | Permissions Summary |
|------|---------------------|
| **Student** | Register, login, create/join groups, manage group members (if leader), view assignments, confirm submissions, track progress |
| **Admin (Professor)** | Login, create/edit/delete assignments, assign to groups, view all groups, track submissions, view analytics dashboard |

---

## 5. Software Requirements Specification (SRS)

### 5.1 Functional Requirements

#### FR-AUTH: Authentication & Authorization
- FR-AUTH-01: The system shall allow students to register with full name, email, student ID, and password.
- FR-AUTH-02: The system shall authenticate users via email and password, returning JWT tokens.
- FR-AUTH-03: The system shall support two roles: "student" and "admin" with distinct permissions.
- FR-AUTH-04: The system shall issue access tokens (short-lived) and refresh tokens (long-lived) for session management.
- FR-AUTH-05: The system shall automatically refresh expired access tokens using the refresh token without requiring re-login.
- FR-AUTH-06: The system shall protect all API routes (except register and login) with JWT verification.
- FR-AUTH-07: The system shall prevent students from accessing admin routes and vice versa.

#### FR-GROUP: Group Management
- FR-GROUP-01: A student shall be able to create a group with a unique name and optional description.
- FR-GROUP-02: The group creator shall become the group leader automatically.
- FR-GROUP-03: The leader shall be able to add members by email or student ID.
- FR-GROUP-04: The system shall prevent adding a student who is already in another group.
- FR-GROUP-05: The system shall enforce a maximum of 6 members per group.
- FR-GROUP-06: The leader shall be able to remove non-leader members from the group.
- FR-GROUP-07: Non-leader members shall be able to leave the group voluntarily.
- FR-GROUP-08: The leader shall be able to delete the group entirely, releasing all members.
- FR-GROUP-09: Admins shall be able to view all groups and their members.
- FR-GROUP-10: A student without a group shall not be able to confirm any submissions.

#### FR-ASSIGN: Assignment Management
- FR-ASSIGN-01: Admins shall be able to create assignments with title, description, due date, and OneDrive link.
- FR-ASSIGN-02: Admins shall be able to assign work to all groups or specific selected groups.
- FR-ASSIGN-03: Admins shall be able to edit existing assignments.
- FR-ASSIGN-04: Admins shall be able to delete assignments (soft delete — hidden but retained).
- FR-ASSIGN-05: Students shall see only assignments that are assigned to their group.
- FR-ASSIGN-06: Each assignment shall display a computed status: "upcoming" (due > 3 days away), "active" (due within 3 days), or "overdue" (past due).
- FR-ASSIGN-07: The OneDrive link shall open in a new browser tab when clicked.

#### FR-SUBMIT: Submission Confirmation
- FR-SUBMIT-01: Any member of a group shall be able to confirm submission for an assignment on behalf of the entire group via a two-step process.
- FR-SUBMIT-02: Submission confirmation shall be irreversible.
- FR-SUBMIT-03: The system shall record the exact timestamp and the identity of the student who triggered the confirmation.
- FR-SUBMIT-04: The system shall prevent duplicate submissions for the same group and assignment (one submission per group per assignment).
- FR-SUBMIT-05: All group members shall see who submitted and when, once any member confirms.
- FR-SUBMIT-06: Group progress shall be tracked as "X of Y assignments submitted" per group.

#### FR-DASH: Dashboard & Analytics
- FR-DASH-01: Students shall see a personal dashboard with group info, pending assignments, and progress overview.
- FR-DASH-02: Admins shall see summary statistics: total students, total groups, total assignments, overall completion rate.
- FR-DASH-03: Admins shall see a per-assignment completion chart (bar chart showing percentage confirmed for each assignment).
- FR-DASH-04: Admins shall see a group performance comparison (completed vs total assignments per group).
- FR-DASH-05: All dashboard data shall reflect real-time state of the database.

### 5.2 Non-Functional Requirements

#### NFR-PERF: Performance
- NFR-PERF-01: All pages shall load within 3 seconds on a standard broadband connection.
- NFR-PERF-02: API responses shall return within 500ms for standard CRUD operations.
- NFR-PERF-03: Dashboard analytics queries shall use efficient SQL (JOINs and aggregates, no N+1 patterns).

#### NFR-SEC: Security
- NFR-SEC-01: All passwords shall be hashed with bcrypt (12 salt rounds).
- NFR-SEC-02: All database queries shall use parameterized statements to prevent SQL injection.
- NFR-SEC-03: JWT secrets shall be stored in environment variables, never hardcoded.
- NFR-SEC-04: API shall implement rate limiting to prevent brute-force attacks.
- NFR-SEC-05: CORS shall be configured to allow only the frontend origin.
- NFR-SEC-06: Sensitive data (passwords, tokens) shall never appear in API responses.

#### NFR-UX: User Experience
- NFR-UX-01: The application shall be fully responsive across mobile (320px+), tablet (768px+), and desktop (1024px+).
- NFR-UX-02: The UI shall provide visual feedback for every user action (loading states, success toasts, error messages).
- NFR-UX-03: All destructive actions shall require confirmation via a modal dialog.
- NFR-UX-04: The UI shall support dark and light themes with a toggle.
- NFR-UX-05: Empty states shall show helpful messages with calls to action.
- NFR-UX-06: The design shall be visually distinctive, professional, and NOT generic AI-generated aesthetics.

#### NFR-MAINTAIN: Maintainability
- NFR-MAINTAIN-01: Code shall follow a modular architecture with clear separation (routes → controllers → services → models).
- NFR-MAINTAIN-02: Frontend shall use component-based architecture with reusable shared components.
- NFR-MAINTAIN-03: State management shall be centralized using Zustand stores.
- NFR-MAINTAIN-04: API responses shall follow a standardized format (success/error structure).

---

## 6. User Stories & Acceptance Criteria

### 6.1 Student Stories

**S-01: Student Registration**
> As a student, I want to register with my name, email, student ID, and password so I can access the platform.

Acceptance Criteria:
- All fields are required. Email must be unique. Student ID must be unique.
- Password minimum 8 characters with at least 1 number and 1 special character.
- Invalid inputs show specific inline error messages below the offending field.
- Duplicate email shows "This email is already registered."
- On success, the student is logged in and redirected to the student dashboard.

**S-02: Student Login**
> As a student, I want to log in with my email and password so I can access my dashboard.

Acceptance Criteria:
- Invalid credentials show "Invalid email or password" (generic for security).
- On success, redirect to student dashboard. JWT tokens issued.
- "Don't have an account?" link navigates to registration.

**S-03: Create a Group**
> As a student without a group, I want to create a new group so I can collaborate with classmates.

Acceptance Criteria:
- Group name is required (3-50 characters, alphanumeric + spaces + hyphens).
- Group name must be unique across the system.
- Optional description (max 200 characters).
- Creator is automatically added as the group leader.
- Student already in a group cannot create another one — show error "You are already in a group."
- On success, redirect to group management page showing the new group.

**S-04: Add Group Members**
> As a group leader, I want to add classmates to my group by their email or student ID.

Acceptance Criteria:
- Only the group leader sees the "Add Member" interface.
- Can search by email or student ID. At least one must be provided.
- If the student doesn't exist in the system: "No student found with that email/ID."
- If the student is already in another group: "This student is already in a group."
- If the group is full (6 members): "Group is full. Maximum 6 members allowed."
- If the student is an admin: "Cannot add admin users to student groups."
- On success, the member appears in the member list immediately.

**S-05: Remove a Group Member**
> As a group leader, I want to remove a member from my group if needed.

Acceptance Criteria:
- Only the leader can remove members.
- A confirmation dialog appears: "Remove [Name] from the group?"
- The leader cannot remove themselves — show "You cannot remove yourself. Delete the group instead."
- On success, the member disappears from the list and their group_id is cleared.

**S-06: Leave a Group**
> As a non-leader group member, I want to leave my group if I need to join a different one.

Acceptance Criteria:
- Only non-leader members see the "Leave Group" button.
- Confirmation dialog: "Are you sure you want to leave [Group Name]?"
- On confirm, the student is removed and sees the empty state ("You're not in a group yet").
- If the group becomes empty after the last member leaves, the group is auto-deleted.

**S-07: View Assignments**
> As a student, I want to see all assignments assigned to my group so I know what work is pending.

Acceptance Criteria:
- Shows only assignments assigned to the student's group (either "all" or specifically selected).
- Each assignment shows: title, description (truncated), due date, status badge.
- Filter tabs: All, Upcoming, Active, Overdue.
- Sorted by due date (nearest first).
- If no assignments: empty state with message.
- If no group: message "Join a group to see assignments."

**S-08: View Assignment Details & OneDrive Link**
> As a student, I want to see full assignment details and access the submission link.

Acceptance Criteria:
- Shows complete: title, full description, due date with relative time ("in 3 days"), status badge.
- OneDrive link displayed as a prominent button that opens in a new browser tab.
- Shows group submission progress: "X of Y members have submitted."
- Shows list of group members with checkmark (submitted) or pending icon next to each.

**S-09: Confirm Submission for Group (Two-Step)**
> As a group member, I want to confirm that my group has submitted our assignment so the professor knows we're done.

Acceptance Criteria:
- Any group member (not just the leader) can confirm submission for the group.
- Step 1: Student clicks "Submit for Group" button.
- Step 2: A modal appears with text "Has your group uploaded the work to OneDrive? This action cannot be undone." and two buttons: "Yes, we have submitted" and "Cancel."
- On cancel: nothing happens, modal closes.
- On confirm: submission is recorded with the confirming student's ID and timestamp. The button permanently changes to "Submitted ✓ by [Name] on [date]" for ALL group members viewing this assignment.
- If the group has already submitted (by any member): the button is replaced with "Submitted ✓ by [Name] on [date]" and no action is possible.
- Student without a group cannot submit — show error.

**S-10: Track Group Progress**
> As a student, I want to see which assignments my group has submitted and which are still pending.

Acceptance Criteria:
- Overall progress: "X of Y assignments submitted" with a visual progress bar.
- Per-assignment row or card showing: title, due date, status badge, and either "Submitted ✓ by [Name]" (green) or "Pending" (amber/gray).
- Pending assignments shown first, then submitted.

**S-11: Student Dashboard**
> As a student, I want a personal dashboard that shows me everything at a glance.

Acceptance Criteria:
- Welcome message with student's name.
- Group info card: group name, member count, leader name. Link to manage group.
- Stats: Total Assignments, Completed, Pending — as visual cards with icons.
- Upcoming Deadlines: next 5 assignments with title, due date, status.
- If no group: prominent CTA card "Create or join a group to get started."

### 6.2 Admin Stories

**A-01: Admin Login**
> As an admin, I want to log in and be directed to the admin dashboard.

Acceptance Criteria:
- Same login form as students. Role detected from JWT.
- Admin is redirected to /admin/dashboard, not /student/dashboard.

**A-02: Create Assignment**
> As an admin, I want to create a new assignment with all necessary details.

Acceptance Criteria:
- Fields: Title (required, 3-100 chars), Description (optional, max 2000 chars), Due Date (required, must be in the future), OneDrive Link (required, valid URL).
- Assignment scope: "All Groups" or "Specific Groups."
- If "Specific Groups" is selected: a multi-select list of all existing groups appears.
- At least one group must be selected when "Specific Groups" is chosen.
- On success: toast notification + redirect to assignment manager.

**A-03: Edit Assignment**
> As an admin, I want to edit an existing assignment to fix errors or update details.

Acceptance Criteria:
- Form pre-filled with current values.
- All fields editable including assignment scope and group selection.
- Changes reflected immediately for students.
- Soft-deleted assignments cannot be edited (404).

**A-04: Delete Assignment**
> As an admin, I want to delete an assignment that is no longer relevant.

Acceptance Criteria:
- Confirmation dialog: "Delete [Assignment Title]? This will hide it from students."
- Soft delete — assignment is hidden but retained in the database.
- Existing submissions are preserved.

**A-05: View All Groups**
> As an admin, I want to see all student groups and their composition.

Acceptance Criteria:
- Table listing: Group Name, Leader Name, Member Count, Created Date.
- Clickable rows — navigate to group detail page.
- Pagination if many groups.

**A-06: Track Submissions**
> As an admin, I want to track which groups and students have confirmed submission for each assignment.

Acceptance Criteria:
- A master view showing: Assignment → Groups → Students with confirmed/pending status.
- Filterable by assignment.
- Status badges: "Confirmed" (green with timestamp) or "Pending" (gray).
- Drill-down: click a group to see individual member status.

**A-07: Analytics Dashboard**
> As an admin, I want analytics to understand class-wide submission performance.

Acceptance Criteria:
- Summary cards: Total Students, Total Groups, Active Assignments, Overall Completion Rate.
- Completion rate is now GROUP-based: (groups that submitted / groups assigned) × 100
- Assignment completion chart: per assignment, shows % of assigned groups that have submitted
- Group performance chart: per group, shows submitted assignments / total assignments assigned
- Charts use real data, update dynamically, have tooltips.

---

## 7. Software Design Specification (SDS)

### 7.1 System Architecture Overview

The system follows a **three-tier architecture**:

**Tier 1 — Presentation (Frontend)**
A React single-page application served by Nginx. Communicates with the backend exclusively through REST API calls. Handles routing, state management, form validation, and visual rendering.

**Tier 2 — Application Logic (Backend)**
A Node.js/Express API server. Handles authentication, authorization, business logic, input validation, and database queries. Follows a layered pattern: Routes → Controllers → Services → Models.

**Tier 3 — Data (Database)**
PostgreSQL relational database. Stores all persistent data: users, groups, assignments, assignment-group mappings, and submission records.

### 7.2 Data Flow Narratives

**Registration Flow:**
User fills form → Frontend validates with Zod → POST /auth/register → Backend validates again → Hash password → Insert user → Generate JWT tokens → Return tokens + user → Frontend stores token in Zustand + refresh token in localStorage → Redirect to dashboard.

**Group Creation Flow:**
Leader fills form → POST /groups → Backend checks: does user already have a group? is name unique? → Create group in a database transaction (insert group + update user's group_id) → Return group → Frontend updates store and UI.

**Assignment Creation Flow:**
Admin fills form → POST /assignments → Backend validates all fields (due date is future, URL is valid) → Insert assignment → If "specific groups" selected: validate all group IDs exist, then insert assignment_groups junction records → Return assignment → Frontend updates list.

**Submission Confirmation Flow:**
Student clicks "Mark as Submitted" → Modal appears with confirmation text → Student clicks "Yes, I have submitted" → POST /submissions → Backend checks: has group? assignment assigned to this group? not already submitted? → Insert submission with confirmed_at timestamp → Return confirmation → Frontend updates button to "Submitted ✓" with timestamp.

**Dashboard Data Flow:**
Page loads → Frontend calls GET /dashboard/admin/summary + /admin/assignments-analytics + /admin/groups-analytics → Backend runs aggregate SQL queries with JOINs → Returns computed statistics → Frontend renders summary cards with animated counters + Recharts bar charts.

### 7.3 Backend Layering Pattern

**Routes** define HTTP endpoints and wire up middleware chains (auth, validation, role guards). They contain zero business logic. They are the "wiring diagram" of the API.

**Controllers** extract data from the request object (params, body, query, user), call the appropriate service method, and format the HTTP response using the standardized response helper. They contain zero database logic.

**Services** contain all business logic: authorization checks (is this user the group leader?), validation rules (is the group full?), data transformation, and orchestration of multiple model calls. They throw meaningful errors with status codes when things go wrong.

**Models** contain raw database queries using parameterized SQL. They accept parameters, execute queries via the connection pool, and return plain JavaScript objects. They contain zero business logic — just data access.

**Middleware** handles cross-cutting concerns that span all requests: JWT authentication, role-based authorization, input validation, global error handling, rate limiting, CORS, security headers, and request logging.

### 7.4 Frontend Architecture Pattern

**Pages** are route-level components. They compose smaller components, call stores for data, and handle page-level state like loading and error states. Each page corresponds to a route in the router.

**Components** are reusable UI building blocks. They receive props, render UI, and emit events upward via callbacks. Organized by domain (auth, student, admin) and shared (common).

**Stores** (Zustand) manage application state that needs to persist across components. Each domain has its own store (auth, group, assignment, submission). Stores call API services and update reactive state that components subscribe to.

**Services** are thin wrappers around Axios calls. They define the exact API endpoint URLs, shape request payloads, and return response data. They abstract the HTTP layer from the stores.

**Layouts** define the structural shell of pages (navbar, sidebar, content area). Routes are nested inside layouts based on user role.

---

## 8. Data Architecture

### 8.1 Entity Relationship Summary

**Users** belong to zero or one **Group** (many-to-one via group_id foreign key).

**Groups** are created by one **User** (the leader, via created_by foreign key).

**Assignments** are created by one **User** (admin, via created_by foreign key).

**Assignments** can be linked to many **Groups** through the **Assignment_Groups** junction table (many-to-many). If assign_to is "all," no junction records are needed — the system queries all groups dynamically.

**Submissions** record that a specific **User** confirmed submission for a specific **Assignment** as part of a specific **Group**. The unique constraint on (assignment_id, student_id) prevents duplicate submissions.

### 8.2 Table Descriptions

**users** — Stores both students and admins. The `role` field ("student" or "admin") distinguishes them. The `group_id` foreign key links students to their group (NULL if not in a group). Admins always have NULL group_id. Email and student_id are both unique.

**groups** — Stores group metadata (name, description). The `created_by` foreign key identifies the leader. The name field has a unique constraint. Deleting a group sets all member's group_id to NULL via ON DELETE SET NULL.

**assignments** — Stores assignment details. The `assign_to` field is either "all" or "specific," determining how the assignment is distributed. The `is_deleted` boolean flag enables soft deletion. The `onedrive_link` stores the external URL where students upload their actual work.

**assignment_groups** — Junction table linking specific assignments to specific groups. Only populated when assign_to is "specific." Has a unique constraint on (assignment_id, group_id) to prevent duplicate mappings. Cascade deletes when either the assignment or group is removed.

**submissions** — Records group-level submission confirmations. Each record means "group G confirmed submission for assignment A, triggered by student S at time T." Has a unique constraint on (assignment_id, group_id) to prevent duplicate group submissions. The `submitted_by` field identifies which specific student triggered the confirmation. The `confirmed_at` timestamp is the critical audit field.

### 8.3 Key Indexes

Indexes are defined on all foreign keys and frequently queried columns: users.email, users.student_id, users.group_id, assignments.due_date, assignments.is_deleted, submissions.assignment_id, submissions.student_id, submissions.group_id, assignment_groups.assignment_id, assignment_groups.group_id. These indexes ensure that JOIN operations and WHERE clauses perform efficiently even with large datasets.

### 8.4 Relationships Diagram

```
users ──(group_id FK)──► groups
groups ──(created_by FK)──► users

assignments ──(created_by FK)──► users

assignment_groups ──(assignment_id FK)──► assignments
assignment_groups ──(group_id FK)──► groups

submissions ──(assignment_id FK)──► assignments
submissions ──(submitted_by FK)──► users
submissions ──(group_id FK)──► groups

UNIQUE CONSTRAINT: (assignment_id, group_id)
```

### 8.5 Assignment Status Computation

Status is NOT stored in the database — it is computed at query time based on the due_date:
- `due_date > NOW() + INTERVAL '3 days'` → **"upcoming"** (blue badge)
- `due_date > NOW() AND due_date <= NOW() + INTERVAL '3 days'` → **"active"** (amber badge)
- `due_date <= NOW()` → **"overdue"** (red badge)

---

## 9. API Contract

### 9.1 Response Format Standard

Every API response follows this structure:

**Success:** `{ "success": true, "data": { ... }, "message": "..." }`

**Error:** `{ "success": false, "error": { "code": "ERROR_CODE", "message": "Human-readable message", "details": [...] } }`

**Paginated:** `{ "success": true, "data": [...], "pagination": { "page": 1, "limit": 20, "total": 45, "totalPages": 3 } }`

### 9.2 Endpoint Catalog

#### Auth Module — /api/v1/auth

| Method | Path | Description | Auth | Role |
|--------|------|-------------|------|------|
| POST | /register | Register a new student account | No | — |
| POST | /login | Login and receive JWT tokens | No | — |
| POST | /refresh | Refresh an expired access token | No | — |
| GET | /me | Get the current authenticated user's profile | Yes | Any |

#### Groups Module — /api/v1/groups

| Method | Path | Description | Auth | Role |
|--------|------|-------------|------|------|
| POST | / | Create a new group | Yes | Student |
| GET | /my-group | Get current user's group with members | Yes | Student |
| POST | /members | Add a member to the group (leader only) | Yes | Student (leader) |
| DELETE | /members/:userId | Remove a member from the group (leader only) | Yes | Student (leader) |
| POST | /leave | Leave the current group (non-leader only) | Yes | Student |
| DELETE | / | Delete the current user's group (leader only) | Yes | Student (leader) |
| GET | / | List all groups with member counts | Yes | Admin |
| GET | /:groupId | Get specific group detail with members | Yes | Admin |

#### Assignments Module — /api/v1/assignments

| Method | Path | Description | Auth | Role |
|--------|------|-------------|------|------|
| POST | / | Create a new assignment | Yes | Admin |
| PUT | /:id | Update an existing assignment | Yes | Admin |
| DELETE | /:id | Soft-delete an assignment | Yes | Admin |
| GET | / | List assignments (filtered by role) | Yes | Any |
| GET | /:id | Get assignment detail with submission status | Yes | Any |

#### Submissions Module — /api/v1/submissions

| Method | Path | Description | Auth | Role |
|--------|------|-------------|------|------|
| POST | / | Confirm submission for the group for an assignment | Yes | Student |
| GET | /my-group-submissions | Get all submissions for the current student's group | Yes | Student |
| GET | /group-progress | Get the current student's group progress across all assignments | Yes | Student |
| GET | /assignment/:assignmentId | Get all group submissions for a specific assignment | Yes | Admin |

#### Dashboard Module — /api/v1/dashboard

| Method | Path | Description | Auth | Role |
|--------|------|-------------|------|------|
| GET | /student | Student dashboard data | Yes | Student |
| GET | /admin/summary | Admin summary statistics | Yes | Admin |
| GET | /admin/assignments-analytics | Per-assignment completion analytics | Yes | Admin |
| GET | /admin/groups-analytics | Per-group performance analytics | Yes | Admin |

---

## 10. Frontend Architecture

### 10.1 Technology Choices

| Technology | Purpose | Why |
|------------|---------|-----|
| React 18 (Vite) | UI framework | Component model, ecosystem, fast builds |
| Tailwind CSS v3 | Styling | Utility-first, rapid iteration, customizable |
| React Router v6 | Routing | Nested routes, layout wrappers, guards |
| Zustand | State management | Lightweight, no boilerplate, clean API |
| Axios | HTTP client | Request/response interceptors for auth |
| Recharts | Charts | React-native, composable, dark-theme ready |
| Lucide React | Icons | Clean, tree-shakeable, consistent |
| React Hook Form + Zod | Forms | Performant + schema validation |
| React Hot Toast | Notifications | Simple, customizable toasts |

### 10.2 Route Map

**Public Routes** (PublicLayout — Navbar only): `/`, `/login`, `/register`

**Student Routes** (StudentLayout — Navbar + Sidebar, protected):
`/student/dashboard`, `/student/assignments`, `/student/assignments/:id`, `/student/group`, `/student/group/create`, `/student/progress`

**Admin Routes** (AdminLayout — Navbar + Sidebar, protected):
`/admin/dashboard`, `/admin/assignments`, `/admin/assignments/new`, `/admin/assignments/:id`, `/admin/groups`, `/admin/groups/:id`, `/admin/submissions`

### 10.3 State Stores

**authStore** — user object, access token, isAuthenticated flag, login/register/logout/checkAuth actions.

**groupStore** — current group, members array, CRUD actions for group management.

**assignmentStore** — assignments list, current assignment, CRUD actions for assignments.

**submissionStore** — user's submissions, group progress data, confirm action.

### 10.4 Component Organization

**common/** — Shared across the entire app: Navbar, Sidebar, ProtectedRoute, LoadingSpinner, EmptyState, StatusBadge, Modal, ConfirmDialog, Skeleton, ErrorBoundary, ProgressBar, AnimatedCounter, Pagination.

**student/** — Domain-specific student components: MemberCard, SubmissionButton, ProgressCard, CompletionBadge.

**admin/** — Domain-specific admin components: SummaryCard, CompletionChart, GroupPerformanceChart, SubmissionTable.

### 10.5 Key Interaction Patterns

Every page that fetches data shows skeleton loaders during loading. Every API action shows a loading spinner on the triggering button. Every success shows a green toast notification. Every error shows a red toast with the error message. Every destructive action (delete, remove, leave) requires a confirmation dialog. Empty states show descriptive messages with call-to-action buttons.

---

## 11. Backend Architecture

### 11.1 Technology Choices

| Technology | Purpose |
|------------|---------|
| Node.js 20 | Runtime |
| Express.js | HTTP framework |
| pg (node-postgres) | PostgreSQL driver with connection pooling |
| bcryptjs | Password hashing |
| jsonwebtoken | JWT creation and verification |
| Zod | Request body validation |
| Winston | Structured logging |
| Helmet | Security headers |
| express-rate-limit | Rate limiting |

### 11.2 Folder Structure Philosophy

The backend follows a **domain-organized layered architecture**. Each domain (auth, groups, assignments, submissions, dashboard) has its own route, controller, service, model, and validator file. Shared concerns (middleware, utilities, config) live in dedicated directories. This structure keeps related code close together while maintaining clear separation of concerns.

### 11.3 Middleware Pipeline

Every request flows through: CORS → Helmet (security headers) → Rate Limiter → Body Parser (JSON) → Morgan (request logging) → Route Handler → [Auth Middleware → Role Guard → Zod Validator → Controller → Service → Model → Database] → Error Handler (catches all thrown errors).

### 11.4 Error Handling Strategy

All errors flow through a centralized error handler middleware. Services throw errors with a `statusCode` and `code` property. Controllers wrap service calls in try/catch and pass errors to next(). The error handler formats the response using the standardized error format and logs via Winston. Stack traces are never exposed in API responses — only in server logs.

---

## 12. Authentication & Security Design

### 12.1 Token Architecture

**Access Token:** Short-lived (15 minutes). Carried in the `Authorization: Bearer <token>` header. Contains userId, email, and role in the JWT payload. Used for authenticating every API request.

**Refresh Token:** Long-lived (7 days). Stored in localStorage by the frontend. Used solely to obtain a new access token when the current one expires.

### 12.2 Frontend Token Flow

1. On login/register: both tokens are received from the API. Access token is stored in Zustand (in-memory state). Refresh token is stored in localStorage (persists across page reloads).
2. On every API request: an Axios request interceptor automatically attaches the access token as a Bearer token in the Authorization header.
3. On 401 response: an Axios response interceptor attempts to call POST /auth/refresh with the stored refresh token. If refresh succeeds, the original request is retried transparently. If refresh fails, the user is logged out and redirected to /login.
4. On page reload: the app checks localStorage for a refresh token. If found, it attempts to refresh and restore the session automatically.

### 12.3 Password Policy

Minimum 8 characters. Must contain at least 1 number and 1 special character. Hashed with bcrypt (12 salt rounds). Never stored in plaintext. Never included in any API response.

### 12.4 Authorization Matrix

| Action | Student | Leader | Admin |
|--------|---------|--------|-------|
| Register | ✅ | ✅ | ❌ (seeded) |
| Create group | ✅ (no group) | N/A | ❌ |
| Add/remove members | ❌ | ✅ | ❌ |
| Leave group | ✅ | ❌ | ❌ |
| Delete group | ❌ | ✅ | ❌ |
| View assignments | ✅ (own) | ✅ (own) | ✅ (all) |
| Create/edit/delete assignments | ❌ | ❌ | ✅ |
| Confirm submission | ✅ | ✅ | ❌ |
| View all groups | ❌ | ❌ | ✅ |
| View analytics | ❌ | ❌ | ✅ |

---

## 13. UI/UX Design System

### 13.1 Design Philosophy

**Tone:** Editorial-Refined meets Modern SaaS. Think "Bloomberg Terminal meets Linear App."

**What it is NOT:** Generic AI-generated dashboards. No purple gradients on white backgrounds. No Inter/Roboto/Arial fonts. No rounded blob decorations. No cookie-cutter component libraries used as-is.

**What it IS:** Dark-first. Typographically driven. Sharp, intentional spacing. Subtle depth through shadow and blur. Micro-interactions that feel crafted. Professional enough for a corporate demo but creative enough to feel designed by a human with taste.

### 13.2 Typography

- **Display & Headings:** "Clash Display" — bold, geometric, modern display font from Fontshare.
- **Body & UI Text:** "Plus Jakarta Sans" — clean, highly readable, professional. From Google Fonts.
- **Monospace (data, IDs, timestamps):** "JetBrains Mono" — developer-grade monospace. From Google Fonts.

### 13.3 Color Palette

**Dark Theme (Default):**
- Backgrounds: #0F1117 (main), #1A1D27 (cards), #242836 (hover/elevated)
- Primary Accent: #4F7BF7 (electric blue)
- Success: #34D399 (emerald green)
- Warning: #FBBF24 (amber)
- Danger: #EF4444 (red)
- Text: #F1F5F9 (headings), #94A3B8 (body), #64748B (metadata)
- Borders: #2A2F3E (default), #3B4252 (hover)

**Light Theme:**
- Backgrounds: #FAFBFC (main), #FFFFFF (cards), #F1F5F9 (elevated)
- Text: #0F172A (headings), #475569 (body), #94A3B8 (metadata)
- Borders: #E2E8F0 (default), #CBD5E1 (hover)
- Accents remain the same.

### 13.4 Animation Guidelines

Page mounts fade in with slight upward slide. Cards elevate on hover with subtle shadow. Progress bars animate width from 0 to target on mount. Modals scale in from 0.95 with backdrop blur. Summary card numbers count up from 0 with easing. Loading skeletons pulse smoothly. Buttons scale slightly on hover and press. Sidebar width transitions smoothly when collapsing.

### 13.5 Responsive Strategy

Mobile (320-767px): single column, sidebar hidden or hamburger, tables scroll horizontally, cards stack vertically.
Tablet (768-1023px): two columns, sidebar icon-only, cards in 2-column grid.
Desktop (1024px+): full layout, sidebar expanded, cards in 3-4 column grid, tables full-width.

---

## 14. Edge Cases & Business Rules

### Authentication
- Duplicate email → 409 with clear message
- Duplicate student_id → 409 with clear message
- Weak password → 400 with specific requirement that failed
- Expired access token → interceptor refreshes seamlessly
- Expired refresh token → force logout with redirect
- Admin registration via form → not possible (form only creates students)

### Groups
- Student already in a group tries to create → 400
- Adding student already in another group → 400
- Adding non-existent student → 404
- Adding admin to group → 400
- Group full (6 members) → 400
- Leader removing self → 400
- Leader leaving → 400
- Non-leader trying to add/remove → 403
- Duplicate group name → 409
- Group deleted → all members released, submissions retained

### Assignments
- Due date in past (on creation) → 400
- Invalid URL format → 400
- "Specific" with no groups selected → 400
- Non-existent group selected → 400
- Editing soft-deleted assignment → 404
- Student with no group → sees "all" assignments but cannot submit

### Submissions
- Student without a group → 400 "You must be in a group to submit"
- Assignment not assigned to student's group → 403 "This assignment is not assigned to your group"
- Group already submitted this assignment (by any member) → 409 "Your group has already submitted this assignment"
- Late submission (after due date) → allowed, timestamp records lateness
- Submission to deleted assignment → 404 "Assignment not found"
- Concurrent double-click by same member → database unique constraint prevents duplicates
- Two members submitting simultaneously → one succeeds, one gets 409 (unique constraint)
- Student submits, then leaves group → submission record retained with original group_id

### General Edge Cases
- Invalid UUID in URL params (/:userId, /:groupId, /:assignmentId) → 400 "Invalid ID format"
- Student with no group viewing assignments → sees "all" assignments but cannot submit
- Student with no group on dashboard → shows CTA to create/join group, no assignment stats

---

## 15. Agile Plan — Epics, Phases & Sprints

### Phase 0: Foundation
- **Sprint 0 — Scaffolding:** Monorepo setup, Express backend skeleton, Vite+React frontend skeleton, Docker PostgreSQL, database migration, admin seed, routing, Axios config, design system CSS.

### Phase 1: Authentication
- **Sprint 1 — Auth Backend:** User model, password hashing, JWT utilities, middleware (auth, role, validation, error handler, rate limiter), register/login/refresh/me endpoints.
- **Sprint 2 — Auth Frontend:** Auth store, Axios interceptors, protected routes, Landing page, Login, Register, Navbar, Sidebar, Layouts.

### Phase 2: Group Management
- **Sprint 3 — Groups Backend:** Group model, validators, service (full CRUD + member management), controller, routes, DB transactions.
- **Sprint 4 — Groups Frontend:** Group store, group management page, create form, add/remove members, leave/delete, empty states, admin views.

### Phase 3: Assignments
- **Sprint 5 — Assignments Backend:** Assignment model, validators, service (CRUD + group assignment + status computation), controller, routes.
- **Sprint 6 — Assignments Frontend:** Assignment store, student list with filters, detail page, admin manager, create/edit forms, group multi-select.

### Phase 4: Submissions
- **Sprint 7 — Submissions Backend:** Submission model, validator, service (confirm + queries + progress), controller, routes.
- **Sprint 8 — Submissions Frontend:** Submission store, two-step confirmation modal, submitted state, progress page, progress bars, badges.

### Phase 5: Dashboard & Analytics
- **Sprint 9 — Dashboard Backend:** Dashboard model (efficient aggregate queries), service, controller, routes.
- **Sprint 10 — Dashboard Frontend:** Student dashboard (group card, stats, deadlines), Admin dashboard (summary cards, Recharts charts), loading skeletons.

### Phase 6: Polish & Delivery
- **Sprint 11 — UI Polish:** Theme toggle, skeletons everywhere, empty states, error boundary, responsive pass, animation polish, favicon, consistency audit.
- **Sprint 12 — Docker & Docs:** Dockerfiles, full docker-compose, seed data script, comprehensive README.

### Phase 7: Quality Assurance
- **Sprint 13 — QA:** Full end-to-end testing, edge case verification, responsive testing, theme testing, bug fixes.

---

## 16. Deployment Architecture

**Local Development:** PostgreSQL in Docker (port 5432), backend via nodemon (port 5000), frontend via Vite dev server (port 5173).

**Docker Production:** Three services in docker-compose — PostgreSQL 16 Alpine (port 5432, persistent volume, auto-runs migrations), Backend Node.js 20 Alpine (port 5000), Frontend Nginx Alpine serving Vite build (port 3000, SPA routing). Backend depends on PostgreSQL health check. Frontend depends on backend.

---

## 17. Deliverables Checklist

- [ ] GitHub Repository with clean commit history (feature branches → PRs → merges)
- [ ] Separate frontend/ and backend/ directories
- [ ] Working Demo (fully functional, zero placeholders)
- [ ] README.md with: overview, setup instructions, API docs, ER diagram, architecture overview, design decisions
- [ ] Seed data with demo accounts
- [ ] Docker setup for one-command deployment
- [ ] Responsive, polished, visually distinctive UI
- [ ] JWT role-based access control
- [ ] Two-step submission confirmation
- [ ] Analytics dashboard with real charts

---

## 18. Glossary

| Term | Definition |
|------|-----------|
| **Group** | A team of 1-6 students. Has one leader (creator). |
| **Leader** | The student who created the group. Exclusive add/remove/delete rights. |
| **Assignment** | Work posted by admin with title, description, due date, OneDrive link. |
| **OneDrive Link** | External URL for actual file upload. Groupd doesn't handle files. |
| **Submission Confirmation** | Student declaring they submitted. Two-step. Irreversible. Timestamped. |
| **Soft Delete** | Hiding without removing from DB (is_deleted = true). |
| **Assign To: All** | Assignment visible to every group. |
| **Assign To: Specific** | Assignment visible only to selected groups (via junction table). |
| **Completion Rate** | (Confirmed submissions / Total expected) × 100%. |
| **Access Token** | Short-lived JWT (15 min) for API authentication. |
| **Refresh Token** | Long-lived JWT (7 days) for obtaining new access tokens. |

---

*This document is the authoritative reference for the entire Groupd project. All implementation decisions must align with the specifications described here.*
