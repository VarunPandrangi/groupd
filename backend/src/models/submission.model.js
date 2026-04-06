import { pool } from '../config/database.js';

const UNKNOWN_GROUP_NAME = 'Unknown Group';

export async function create(
  { assignment_id, group_id, submitted_by },
  db = pool
) {
  const sql = `
    WITH source_group AS (
      SELECT id, name
      FROM groups
      WHERE id = $2
    ),
    inserted AS (
      INSERT INTO submissions (assignment_id, group_id, group_name, submitted_by)
      SELECT $1, g.id, g.name, $3
      FROM source_group g
      RETURNING id, assignment_id, group_id, group_name, submitted_by, confirmed_at
    )
    SELECT
      s.id,
      s.assignment_id,
      s.group_id,
      s.group_name,
      (s.group_id IS NULL) AS group_deleted,
      s.submitted_by,
      u.full_name AS submitted_by_name,
      u.email AS submitted_by_email,
      s.confirmed_at
    FROM inserted s
    JOIN users u ON u.id = s.submitted_by
  `;

  const { rows } = await db.query(sql, [assignment_id, group_id, submitted_by]);
  return rows[0];
}

export async function findByAssignmentAndGroup(assignmentId, groupId, db = pool) {
  const sql = `
    SELECT
      s.id,
      s.assignment_id,
      s.group_id,
      s.submitted_by,
      u.full_name AS submitted_by_name,
      u.email AS submitted_by_email,
      s.confirmed_at
    FROM submissions s
    JOIN users u ON u.id = s.submitted_by
    WHERE s.assignment_id = $1
      AND s.group_id = $2
    LIMIT 1
  `;

  const { rows } = await db.query(sql, [assignmentId, groupId]);
  return rows[0] || null;
}

export async function getByAssignment(assignmentId, db = pool) {
  const sql = `
    SELECT
      s.id,
      s.group_id,
      COALESCE(g.name, s.group_name, '${UNKNOWN_GROUP_NAME}') AS group_name,
      (s.group_id IS NULL) AS group_deleted,
      u.full_name AS submitted_by_name,
      u.email AS submitted_by_email,
      s.confirmed_at
    FROM submissions s
    LEFT JOIN groups g ON g.id = s.group_id
    JOIN users u ON u.id = s.submitted_by
    WHERE s.assignment_id = $1
    ORDER BY
      s.confirmed_at ASC,
      COALESCE(g.name, s.group_name, '${UNKNOWN_GROUP_NAME}') ASC,
      u.full_name ASC
  `;

  const { rows } = await db.query(sql, [assignmentId]);
  return rows;
}

export async function getAssignmentGroupTrackerRows(assignmentId, db = pool) {
  const sql = `
    WITH assignment_scope AS (
      SELECT id, assign_to
      FROM assignments
      WHERE id = $1
        AND is_deleted = FALSE
    ),
    expected_groups AS (
      SELECT
        g.id AS group_id,
        g.name AS group_name
      FROM assignment_scope a
      JOIN groups g
        ON a.assign_to = 'all'

      UNION ALL

      SELECT
        g.id AS group_id,
        g.name AS group_name
      FROM assignment_scope a
      JOIN assignment_groups ag
        ON a.assign_to = 'specific'
       AND ag.assignment_id = a.id
      JOIN groups g
        ON g.id = ag.group_id
    ),
    live_group_rows AS (
      SELECT
        eg.group_id,
        COALESCE(g.name, s.group_name, '${UNKNOWN_GROUP_NAME}') AS group_name,
        (s.id IS NOT NULL) AS is_submitted,
        u.full_name AS submitted_by_name,
        u.email AS submitted_by_email,
        s.confirmed_at,
        FALSE AS group_deleted,
        NULL::text AS group_note,
        s.id AS submission_id
      FROM expected_groups eg
      LEFT JOIN submissions s
        ON s.assignment_id = $1
       AND s.group_id = eg.group_id
      LEFT JOIN groups g
        ON g.id = eg.group_id
      LEFT JOIN users u
        ON u.id = s.submitted_by
    ),
    deleted_group_rows AS (
      SELECT
        NULL::uuid AS group_id,
        COALESCE(s.group_name, '${UNKNOWN_GROUP_NAME}') AS group_name,
        TRUE AS is_submitted,
        u.full_name AS submitted_by_name,
        u.email AS submitted_by_email,
        s.confirmed_at,
        TRUE AS group_deleted,
        'Group no longer exists - members were released.'::text AS group_note,
        s.id AS submission_id
      FROM submissions s
      LEFT JOIN users u
        ON u.id = s.submitted_by
      WHERE s.assignment_id = $1
        AND s.group_id IS NULL
    )
    SELECT
      group_id,
      group_name,
      is_submitted,
      submitted_by_name,
      submitted_by_email,
      confirmed_at,
      group_deleted,
      group_note,
      submission_id
    FROM live_group_rows

    UNION ALL

    SELECT
      group_id,
      group_name,
      is_submitted,
      submitted_by_name,
      submitted_by_email,
      confirmed_at,
      group_deleted,
      group_note,
      submission_id
    FROM deleted_group_rows

    ORDER BY
      group_name ASC,
      group_deleted ASC,
      confirmed_at ASC NULLS LAST
  `;

  const { rows } = await db.query(sql, [assignmentId]);
  return rows;
}

export async function getStudentMembersByGroupIds(groupIds, db = pool) {
  if (!groupIds.length) {
    return [];
  }

  const sql = `
    SELECT
      u.group_id,
      u.id,
      u.full_name,
      u.email,
      u.student_id
    FROM users u
    WHERE u.role = 'student'
      AND u.group_id = ANY($1::uuid[])
    ORDER BY u.group_id ASC, u.full_name ASC
  `;

  const { rows } = await db.query(sql, [groupIds]);
  return rows;
}

export async function getByGroup(groupId, db = pool) {
  const sql = `
    SELECT
      s.assignment_id,
      a.title,
      a.due_date,
      u.full_name AS submitted_by_name,
      s.confirmed_at
    FROM submissions s
    JOIN assignments a ON a.id = s.assignment_id
    JOIN users u ON u.id = s.submitted_by
    WHERE s.group_id = $1
      AND a.is_deleted = FALSE
    ORDER BY a.due_date ASC, s.confirmed_at DESC
  `;

  const { rows } = await db.query(sql, [groupId]);
  return rows;
}

export async function getGroupProgress(groupId, db = pool) {
  const sql = `
    SELECT
      a.id AS assignment_id,
      a.title,
      a.due_date,
      CASE
        WHEN a.due_date <= NOW() THEN 'overdue'
        WHEN a.due_date <= NOW() + INTERVAL '3 days' THEN 'active'
        ELSE 'upcoming'
      END AS status,
      (s.id IS NOT NULL) AS is_submitted,
      u.full_name AS submitted_by_name,
      s.confirmed_at
    FROM assignments a
    LEFT JOIN submissions s
      ON s.assignment_id = a.id
     AND s.group_id = $1
    LEFT JOIN users u
      ON u.id = s.submitted_by
    WHERE a.is_deleted = FALSE
      AND (
        a.assign_to = 'all'
        OR EXISTS (
          SELECT 1
          FROM assignment_groups ag
          WHERE ag.assignment_id = a.id
            AND ag.group_id = $1
        )
      )
    ORDER BY
      (s.id IS NOT NULL) ASC,
      a.due_date ASC,
      a.created_at DESC
  `;

  const { rows } = await db.query(sql, [groupId]);
  return rows.map((row) => ({
    assignment_id: row.assignment_id,
    title: row.title,
    due_date: row.due_date,
    status: row.status,
    is_submitted: row.is_submitted,
    submitted_by_name: row.submitted_by_name ?? null,
    confirmed_at: row.confirmed_at ?? null,
  }));
}
