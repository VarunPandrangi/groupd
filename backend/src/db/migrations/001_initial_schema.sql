-- JoinEazy initial database schema
-- Derived from plan.md Section 8 (Data Architecture)

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =====================================================================
-- groups
-- Created first (without created_by FK) to break circular dependency
-- with users. The FK is added via ALTER TABLE after users exists.
-- =====================================================================
CREATE TABLE IF NOT EXISTS groups (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(200),
    created_by  UUID,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT groups_name_length CHECK (char_length(name) >= 3)
);

-- =====================================================================
-- users
-- =====================================================================
CREATE TABLE IF NOT EXISTS users (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name     VARCHAR(100) NOT NULL,
    email         VARCHAR(255) NOT NULL UNIQUE,
    student_id    VARCHAR(50) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role          VARCHAR(20) NOT NULL CHECK (role IN ('student', 'admin')),
    group_id      UUID REFERENCES groups(id) ON DELETE SET NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT users_admin_no_student_id CHECK (
        (role = 'admin' AND student_id IS NULL)
        OR (role = 'student' AND student_id IS NOT NULL)
    ),
    CONSTRAINT users_admin_no_group CHECK (
        role = 'student' OR group_id IS NULL
    )
);

-- Now add the deferred FK from groups.created_by -> users.id
ALTER TABLE groups DROP CONSTRAINT IF EXISTS fk_groups_created_by;
ALTER TABLE groups
    ADD CONSTRAINT fk_groups_created_by
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;

-- =====================================================================
-- assignments
-- =====================================================================
CREATE TABLE IF NOT EXISTS assignments (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title          VARCHAR(100) NOT NULL,
    description    TEXT,
    due_date       TIMESTAMPTZ NOT NULL,
    onedrive_link  TEXT NOT NULL,
    assign_to      VARCHAR(20) NOT NULL CHECK (assign_to IN ('all', 'specific')),
    is_deleted     BOOLEAN NOT NULL DEFAULT FALSE,
    created_by     UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================================
-- assignment_groups (junction for assign_to = 'specific')
-- =====================================================================
CREATE TABLE IF NOT EXISTS assignment_groups (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
    group_id      UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT assignment_groups_unique UNIQUE (assignment_id, group_id)
);

-- =====================================================================
-- submissions
-- =====================================================================
DROP TABLE IF EXISTS submissions;
CREATE TABLE IF NOT EXISTS submissions (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
    group_id      UUID REFERENCES groups(id) ON DELETE SET NULL,
    group_name    VARCHAR(100),
    submitted_by  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    confirmed_at  TIMESTAMPTZ DEFAULT NOW(),
    created_at    TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (assignment_id, group_id)
);

-- =====================================================================
-- Indexes (plan.md Section 8.3)
-- =====================================================================
CREATE INDEX IF NOT EXISTS idx_users_email            ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_student_id       ON users(student_id);
CREATE INDEX IF NOT EXISTS idx_users_group_id         ON users(group_id);

CREATE INDEX IF NOT EXISTS idx_assignments_due_date   ON assignments(due_date);
CREATE INDEX IF NOT EXISTS idx_assignments_is_deleted ON assignments(is_deleted);

CREATE INDEX IF NOT EXISTS idx_submissions_assignment_id ON submissions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_submissions_group_id      ON submissions(group_id);
CREATE INDEX IF NOT EXISTS idx_submissions_submitted_by  ON submissions(submitted_by);

CREATE INDEX IF NOT EXISTS idx_assignment_groups_assignment_id ON assignment_groups(assignment_id);
CREATE INDEX IF NOT EXISTS idx_assignment_groups_group_id      ON assignment_groups(group_id);
