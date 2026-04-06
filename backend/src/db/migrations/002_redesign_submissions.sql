-- Migration 002: Redesign submissions table to be group-centric
-- This migration drops the existing individual-based submissions table
-- and recreates it to support one submission per group per assignment.

DROP TABLE IF EXISTS submissions;

CREATE TABLE submissions (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
    group_id      UUID REFERENCES groups(id) ON DELETE SET NULL,
    group_name    VARCHAR(100),
    submitted_by  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    confirmed_at  TIMESTAMPTZ DEFAULT NOW(),
    created_at    TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (assignment_id, group_id)
);

CREATE INDEX IF NOT EXISTS idx_submissions_assignment_id ON submissions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_submissions_group_id      ON submissions(group_id);
CREATE INDEX IF NOT EXISTS idx_submissions_submitted_by  ON submissions(submitted_by);
