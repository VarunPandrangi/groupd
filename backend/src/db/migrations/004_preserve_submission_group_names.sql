BEGIN;

ALTER TABLE submissions
    ADD COLUMN IF NOT EXISTS group_name VARCHAR(100);

UPDATE submissions s
SET group_name = g.name
FROM groups g
WHERE s.group_id = g.id
  AND s.group_name IS NULL;

ALTER TABLE submissions
    ALTER COLUMN group_id DROP NOT NULL;

ALTER TABLE submissions
    DROP CONSTRAINT IF EXISTS submissions_group_id_fkey;

ALTER TABLE submissions
    ADD CONSTRAINT submissions_group_id_fkey
    FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE SET NULL;

COMMIT;
