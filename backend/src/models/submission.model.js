import { pool } from '../config/database.js';

export async function create(
  { assignment_id, group_id, submitted_by },
  db = pool
) {
  const sql = `
    WITH inserted AS (
      INSERT INTO submissions (assignment_id, group_id, submitted_by)
      VALUES ($1, $2, $3)
      RETURNING id, assignment_id, group_id, submitted_by, confirmed_at
    )
    SELECT
      s.id,
      s.assignment_id,
      s.group_id,
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
      s.group_id,
      g.name AS group_name,
      u.full_name AS submitted_by_name,
      u.email AS submitted_by_email,
      s.confirmed_at
    FROM submissions s
    JOIN groups g ON g.id = s.group_id
    JOIN users u ON u.id = s.submitted_by
    WHERE s.assignment_id = $1
    ORDER BY s.confirmed_at ASC, g.name ASC
  `;

  const { rows } = await db.query(sql, [assignmentId]);
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
