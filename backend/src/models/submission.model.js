import { pool } from '../config/database.js';

/**
 * Insert a new submission record and return it with confirmed_at.
 */
export async function create({ assignment_id, student_id, group_id }, db = pool) {
  const sql = `
    INSERT INTO submissions (assignment_id, student_id, group_id)
    VALUES ($1, $2, $3)
    RETURNING id, assignment_id, student_id, group_id, confirmed_at
  `;

  const { rows } = await db.query(sql, [assignment_id, student_id, group_id]);
  return rows[0];
}

/**
 * Check if a student has already submitted for a given assignment.
 * Used for the duplicate-submission guard.
 */
export async function findByAssignmentAndStudent(assignmentId, studentId, db = pool) {
  const sql = `
    SELECT id, assignment_id, student_id, group_id, confirmed_at
    FROM submissions
    WHERE assignment_id = $1
      AND student_id = $2
  `;

  const { rows } = await db.query(sql, [assignmentId, studentId]);
  return rows[0] || null;
}

/**
 * Get all submissions for a specific assignment, joined with user details
 * and group name. Used by admin to view per-assignment submission status.
 */
export async function getByAssignment(assignmentId, db = pool) {
  const sql = `
    SELECT
      s.id,
      s.assignment_id,
      s.student_id,
      s.group_id,
      s.confirmed_at,
      u.full_name,
      u.email,
      u.student_id AS student_identifier,
      g.name AS group_name
    FROM submissions s
    JOIN users u ON u.id = s.student_id
    LEFT JOIN groups g ON g.id = s.group_id
    WHERE s.assignment_id = $1
    ORDER BY s.confirmed_at ASC, u.full_name ASC
  `;

  const { rows } = await db.query(sql, [assignmentId]);
  return rows;
}

/**
 * Get all submissions by a specific student, joined with assignment titles.
 */
export async function getByStudent(studentId, db = pool) {
  const sql = `
    SELECT
      s.id,
      s.assignment_id,
      s.student_id,
      s.group_id,
      s.confirmed_at,
      a.title,
      a.due_date,
      a.onedrive_link
    FROM submissions s
    JOIN assignments a ON a.id = s.assignment_id
    WHERE s.student_id = $1
      AND a.is_deleted = FALSE
    ORDER BY s.confirmed_at DESC
  `;

  const { rows } = await db.query(sql, [studentId]);
  return rows;
}

/**
 * For each assignment assigned to a group, count how many of the group's
 * members have submitted vs total members.
 *
 * Returns: { assignment_id, title, due_date, submitted_count, total_members, is_complete }
 *
 * Logic:
 * - An assignment is "assigned to this group" if assign_to='all' OR
 *   there is a matching row in assignment_groups.
 * - total_members = count of users whose group_id = this group.
 * - submitted_count = count of submissions for this assignment where
 *   the student's current group_id = this group (so members who left
 *   are not counted).
 */
export async function getGroupProgress(groupId, db = pool) {
  const sql = `
    SELECT
      a.id           AS assignment_id,
      a.title,
      a.due_date,
      COUNT(DISTINCT s.student_id) FILTER (
        WHERE s.id IS NOT NULL AND u_sub.group_id = $1
      )                           AS submitted_count,
      (
        SELECT COUNT(*)
        FROM users
        WHERE group_id = $1
      )                           AS total_members,
      CASE
        WHEN COUNT(DISTINCT s.student_id) FILTER (
          WHERE s.id IS NOT NULL AND u_sub.group_id = $1
        ) >= (
          SELECT COUNT(*) FROM users WHERE group_id = $1
        ) THEN TRUE
        ELSE FALSE
      END                         AS is_complete
    FROM assignments a
    LEFT JOIN submissions s
      ON s.assignment_id = a.id
    LEFT JOIN users u_sub
      ON u_sub.id = s.student_id
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
    GROUP BY a.id, a.title, a.due_date
    ORDER BY a.due_date ASC
  `;

  const { rows } = await db.query(sql, [groupId]);

  // Cast counts from string to number (pg returns bigint as string)
  return rows.map((row) => ({
    assignment_id: row.assignment_id,
    title: row.title,
    due_date: row.due_date,
    submitted_count: Number(row.submitted_count),
    total_members: Number(row.total_members),
    is_complete: row.is_complete,
  }));
}
