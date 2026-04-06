import { pool } from '../config/database.js';

const ASSIGNMENT_STATUS_CASE = `
  CASE
    WHEN a.due_date <= NOW() THEN 'overdue'
    WHEN a.due_date <= NOW() + INTERVAL '3 days' THEN 'active'
    ELSE 'upcoming'
  END
`;

const EMPTY_STUDENT_DASHBOARD = {
  group: null,
  totalAssignments: null,
  submittedCount: null,
  pendingCount: null,
  upcomingDeadlines: [],
};

export async function getStudentDashboard(userId, db = pool) {
  const groupSql = `
    SELECT
      g.id,
      g.name,
      g.description,
      g.created_by,
      g.created_at,
      g.updated_at,
      COALESCE(
        json_agg(
          json_build_object(
            'id', m.id,
            'full_name', m.full_name,
            'email', m.email,
            'student_id', m.student_id
          )
          ORDER BY
            CASE WHEN m.id = g.created_by THEN 0 ELSE 1 END,
            m.full_name ASC
        ) FILTER (WHERE m.id IS NOT NULL),
        '[]'::json
      ) AS members
    FROM users u
    LEFT JOIN groups g
      ON g.id = u.group_id
    LEFT JOIN users m
      ON m.group_id = g.id
    WHERE u.id = $1
    GROUP BY g.id, g.name, g.description, g.created_by, g.created_at, g.updated_at
  `;

  const { rows: groupRows } = await db.query(groupSql, [userId]);
  const groupRow = groupRows[0];

  if (!groupRow) {
    return null;
  }

  if (!groupRow.id) {
    return EMPTY_STUDENT_DASHBOARD;
  }

  const countsSql = `
    WITH assigned_assignments AS (
      SELECT a.id
      FROM assignments a
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
    )
    SELECT
      (SELECT COUNT(*) FROM assigned_assignments) AS total_assignments,
      (
        SELECT COUNT(*)
        FROM submissions s
        JOIN assignments a
          ON a.id = s.assignment_id
        WHERE s.group_id = $1
          AND a.is_deleted = FALSE
      ) AS submitted_count
  `;

  const upcomingSql = `
    SELECT
      a.id,
      a.title,
      a.due_date,
      ${ASSIGNMENT_STATUS_CASE} AS status
    FROM assignments a
    LEFT JOIN submissions s
      ON s.assignment_id = a.id
     AND s.group_id = $1
    WHERE a.is_deleted = FALSE
      AND s.id IS NULL
      AND (
        a.assign_to = 'all'
        OR EXISTS (
          SELECT 1
          FROM assignment_groups ag
          WHERE ag.assignment_id = a.id
            AND ag.group_id = $1
        )
      )
    ORDER BY a.due_date ASC, a.created_at DESC
    LIMIT 5
  `;

  const [countsResult, upcomingResult] = await Promise.all([
    db.query(countsSql, [groupRow.id]),
    db.query(upcomingSql, [groupRow.id]),
  ]);

  const totalAssignments = Number(countsResult.rows[0].total_assignments);
  const submittedCount = Number(countsResult.rows[0].submitted_count);

  return {
    group: {
      id: groupRow.id,
      name: groupRow.name,
      description: groupRow.description,
      created_by: groupRow.created_by,
      created_at: groupRow.created_at,
      updated_at: groupRow.updated_at,
      members: groupRow.members ?? [],
    },
    totalAssignments,
    submittedCount,
    pendingCount: totalAssignments - submittedCount,
    upcomingDeadlines: upcomingResult.rows,
  };
}

export async function getAdminSummary(db = pool) {
  const sql = `
    WITH group_count AS (
      SELECT COUNT(*) AS total_groups
      FROM groups
    ),
    assignment_group_counts AS (
      SELECT
        ag.assignment_id,
        COUNT(*) AS groups_assigned
      FROM assignment_groups ag
      GROUP BY ag.assignment_id
    ),
    pair_count AS (
      SELECT
        COALESCE(
          SUM(
            CASE
              WHEN a.assign_to = 'all' THEN gc.total_groups
              ELSE COALESCE(agc.groups_assigned, 0)
            END
          ),
          0
        ) AS total_pairs
      FROM assignments a
      CROSS JOIN group_count gc
      LEFT JOIN assignment_group_counts agc
        ON agc.assignment_id = a.id
      WHERE a.is_deleted = FALSE
    ),
    submission_count AS (
      SELECT COUNT(*) AS total_submissions
      FROM submissions s
      JOIN assignments a
        ON a.id = s.assignment_id
      WHERE a.is_deleted = FALSE
    )
    SELECT
      (SELECT COUNT(*) FROM users WHERE role = 'student') AS total_students,
      gc.total_groups,
      (SELECT COUNT(*) FROM assignments WHERE is_deleted = FALSE) AS total_assignments,
      CASE
        WHEN pc.total_pairs = 0 THEN 0
        ELSE (sc.total_submissions::float8 / pc.total_pairs) * 100
      END AS overall_completion_rate
    FROM group_count gc
    CROSS JOIN pair_count pc
    CROSS JOIN submission_count sc
  `;

  const { rows } = await db.query(sql);
  return rows[0];
}

export async function getAssignmentAnalytics(db = pool) {
  const sql = `
    WITH group_count AS (
      SELECT COUNT(*) AS total_groups
      FROM groups
    ),
    assignment_group_counts AS (
      SELECT
        ag.assignment_id,
        COUNT(*) AS groups_assigned
      FROM assignment_groups ag
      GROUP BY ag.assignment_id
    ),
    submission_counts AS (
      SELECT
        s.assignment_id,
        COUNT(*) AS groups_submitted
      FROM submissions s
      GROUP BY s.assignment_id
    )
    SELECT
      a.id,
      a.title,
      a.due_date,
      ${ASSIGNMENT_STATUS_CASE} AS status,
      COALESCE(sc.groups_submitted, 0) AS groups_submitted,
      CASE
        WHEN a.assign_to = 'all' THEN gc.total_groups
        ELSE COALESCE(agc.groups_assigned, 0)
      END AS groups_assigned,
      CASE
        WHEN (
          CASE
            WHEN a.assign_to = 'all' THEN gc.total_groups
            ELSE COALESCE(agc.groups_assigned, 0)
          END
        ) = 0 THEN 0
        ELSE (
          COALESCE(sc.groups_submitted, 0)::float8
          / (
            CASE
              WHEN a.assign_to = 'all' THEN gc.total_groups
              ELSE COALESCE(agc.groups_assigned, 0)
            END
          )
        ) * 100
      END AS completion_rate
    FROM assignments a
    CROSS JOIN group_count gc
    LEFT JOIN assignment_group_counts agc
      ON agc.assignment_id = a.id
    LEFT JOIN submission_counts sc
      ON sc.assignment_id = a.id
    WHERE a.is_deleted = FALSE
    ORDER BY a.due_date DESC, a.created_at DESC
  `;

  const { rows } = await db.query(sql);
  return rows;
}

export async function getGroupAnalytics(db = pool) {
  const sql = `
    WITH active_all_assignments AS (
      SELECT COUNT(*) AS total_all_assignments
      FROM assignments
      WHERE is_deleted = FALSE
        AND assign_to = 'all'
    ),
    member_counts AS (
      SELECT
        u.group_id,
        COUNT(*) AS member_count
      FROM users u
      WHERE u.group_id IS NOT NULL
      GROUP BY u.group_id
    ),
    specific_assignment_counts AS (
      SELECT
        ag.group_id,
        COUNT(*) AS total_assignments
      FROM assignment_groups ag
      JOIN assignments a
        ON a.id = ag.assignment_id
      WHERE a.is_deleted = FALSE
        AND a.assign_to = 'specific'
      GROUP BY ag.group_id
    ),
    submission_counts AS (
      SELECT
        s.group_id,
        COUNT(*) AS submitted_assignments
      FROM submissions s
      JOIN assignments a
        ON a.id = s.assignment_id
      WHERE s.group_id IS NOT NULL
        AND a.is_deleted = FALSE
      GROUP BY s.group_id
    )
    SELECT
      g.id,
      g.name,
      COALESCE(mc.member_count, 0) AS member_count,
      (
        aaa.total_all_assignments
        + COALESCE(sac.total_assignments, 0)
      ) AS total_assignments,
      COALESCE(sc.submitted_assignments, 0) AS submitted_assignments,
      CASE
        WHEN (
          aaa.total_all_assignments
          + COALESCE(sac.total_assignments, 0)
        ) = 0 THEN 0
        ELSE (
          COALESCE(sc.submitted_assignments, 0)::float8
          / (
            aaa.total_all_assignments
            + COALESCE(sac.total_assignments, 0)
          )
        ) * 100
      END AS completion_rate
    FROM groups g
    CROSS JOIN active_all_assignments aaa
    LEFT JOIN member_counts mc
      ON mc.group_id = g.id
    LEFT JOIN specific_assignment_counts sac
      ON sac.group_id = g.id
    LEFT JOIN submission_counts sc
      ON sc.group_id = g.id
    ORDER BY completion_rate DESC, g.name ASC
  `;

  const { rows } = await db.query(sql);
  return rows;
}
