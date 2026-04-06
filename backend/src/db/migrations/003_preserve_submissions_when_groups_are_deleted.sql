-- Keep submission audit history when groups are deleted.
-- plan.md Section 14 requires: "Group deleted -> all members released, submissions retained"

ALTER TABLE submissions
    ALTER COLUMN group_id DROP NOT NULL;

ALTER TABLE submissions
    DROP CONSTRAINT IF EXISTS submissions_group_id_fkey;

ALTER TABLE submissions
    ADD CONSTRAINT submissions_group_id_fkey
    FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE SET NULL;
