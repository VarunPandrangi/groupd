import { pool } from '../config/database.js';

const SAFE_ASSIGNMENT_COLUMNS = `
  id,
  title,
  description,
  due_date,
  onedrive_link,
  assign_to,
  is_deleted,
  created_by,
  created_at,
  updated_at
`;

const SAFE_ASSIGNMENT_SELECT = `
  a.id,
  a.title,
  a.description,
  a.due_date,
  a.onedrive_link,
  a.assign_to,
  a.is_deleted,
  a.created_by,
  a.created_at,
  a.updated_at
`;

const SAFE_GROUP_COLUMNS = `
  g.id,
  g.name,
  g.description,
  g.created_by,
  g.created_at,
  g.updated_at
`;

export async function create(
  { title, description, due_date, onedrive_link, assign_to, created_by },
  db = pool
) {
  const sql = `
    INSERT INTO assignments (
      title,
      description,
      due_date,
      onedrive_link,
      assign_to,
      created_by
    )
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING ${SAFE_ASSIGNMENT_COLUMNS}
  `;

  const { rows } = await db.query(sql, [
    title,
    description ?? null,
    due_date,
    onedrive_link,
    assign_to,
    created_by,
  ]);

  return rows[0];
}

export async function findById(id, db = pool) {
  const sql = `
    SELECT ${SAFE_ASSIGNMENT_COLUMNS}
    FROM assignments
    WHERE id = $1
      AND is_deleted = FALSE
  `;

  const { rows } = await db.query(sql, [id]);
  return rows[0] || null;
}

export async function update(id, fields, db = pool) {
  const allowedFields = [
    'title',
    'description',
    'due_date',
    'onedrive_link',
    'assign_to',
  ];

  const entries = Object.entries(fields).filter(
    ([key, value]) => allowedFields.includes(key) && value !== undefined
  );

  if (entries.length === 0) {
    return findById(id, db);
  }

  const values = [];
  const setClauses = entries.map(([key, value], index) => {
    values.push(key === 'description' ? value ?? null : value);
    return `${key} = $${index + 1}`;
  });

  values.push(id);

  const sql = `
    UPDATE assignments
    SET ${setClauses.join(', ')}, updated_at = NOW()
    WHERE id = $${values.length}
      AND is_deleted = FALSE
    RETURNING ${SAFE_ASSIGNMENT_COLUMNS}
  `;

  const { rows } = await db.query(sql, values);
  return rows[0] || null;
}

export async function softDelete(id, db = pool) {
  const sql = `
    UPDATE assignments
    SET is_deleted = TRUE, updated_at = NOW()
    WHERE id = $1
      AND is_deleted = FALSE
    RETURNING ${SAFE_ASSIGNMENT_COLUMNS}
  `;

  const { rows } = await db.query(sql, [id]);
  return rows[0] || null;
}

export async function getAll(page, limit, db = pool) {
  const offset = (page - 1) * limit;

  const listSql = `
    SELECT ${SAFE_ASSIGNMENT_SELECT}
    FROM assignments a
    WHERE a.is_deleted = FALSE
    ORDER BY a.due_date ASC, a.created_at DESC
    LIMIT $1 OFFSET $2
  `;

  const totalSql = `
    SELECT COUNT(*) AS total
    FROM assignments
    WHERE is_deleted = FALSE
  `;

  const [listResult, totalResult] = await Promise.all([
    db.query(listSql, [limit, offset]),
    db.query(totalSql),
  ]);

  const total = Number(totalResult.rows[0].total);

  return {
    assignments: listResult.rows,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
}

export async function getUnassignedStudentAssignments(_userId, db = pool) {
  const sql = `
    SELECT
      ${SAFE_ASSIGNMENT_SELECT},
      NULL::timestamptz AS group_confirmed_at,
      NULL::text AS submitted_by_name
    FROM assignments a
    WHERE a.is_deleted = FALSE
      AND a.assign_to = 'all'
    ORDER BY a.due_date ASC, a.created_at DESC
  `;

  const { rows } = await db.query(sql);
  return rows;
}

export async function getForStudent(userId, db = pool) {
  const sql = `
    SELECT
      ${SAFE_ASSIGNMENT_SELECT},
      s.confirmed_at AS group_confirmed_at,
      submitter.full_name AS submitted_by_name
    FROM users u
    JOIN assignments a
      ON a.is_deleted = FALSE
    LEFT JOIN submissions s
      ON s.assignment_id = a.id
     AND s.group_id = u.group_id
    LEFT JOIN users submitter
      ON submitter.id = s.submitted_by
    WHERE u.id = $1
      AND (
        a.assign_to = 'all'
        OR (
          u.group_id IS NOT NULL
          AND EXISTS (
            SELECT 1
            FROM assignment_groups ag
            WHERE ag.assignment_id = a.id
              AND ag.group_id = u.group_id
          )
        )
      )
    ORDER BY a.due_date ASC, a.created_at DESC
  `;

  const { rows } = await db.query(sql, [userId]);
  return rows;
}

export async function addGroups(assignmentId, groupIds, db = pool) {
  if (!groupIds.length) {
    return [];
  }

  const placeholders = groupIds
    .map((_, index) => `($1, $${index + 2})`)
    .join(', ');

  const sql = `
    INSERT INTO assignment_groups (assignment_id, group_id)
    VALUES ${placeholders}
    RETURNING id, assignment_id, group_id, created_at
  `;

  const { rows } = await db.query(sql, [assignmentId, ...groupIds]);
  return rows;
}

export async function removeGroups(assignmentId, db = pool) {
  const result = await db.query(
    'DELETE FROM assignment_groups WHERE assignment_id = $1',
    [assignmentId]
  );

  return result.rowCount;
}

export async function getAssignmentGroups(assignmentId, db = pool) {
  const sql = `
    SELECT ${SAFE_GROUP_COLUMNS}
    FROM assignment_groups ag
    JOIN groups g ON g.id = ag.group_id
    WHERE ag.assignment_id = $1
    ORDER BY g.name ASC
  `;

  const { rows } = await db.query(sql, [assignmentId]);
  return rows;
}

export async function findGroupsByIds(groupIds, db = pool) {
  if (!groupIds.length) {
    return [];
  }

  const sql = `
    SELECT ${SAFE_GROUP_COLUMNS}
    FROM groups g
    WHERE g.id = ANY($1::uuid[])
    ORDER BY g.name ASC
  `;

  const { rows } = await db.query(sql, [groupIds]);
  return rows;
}

export async function getGroupsForAssignments(assignmentIds, db = pool) {
  if (!assignmentIds.length) {
    return [];
  }

  const sql = `
    SELECT
      ag.assignment_id,
      g.id,
      g.name,
      g.description,
      g.created_by,
      g.created_at,
      g.updated_at
    FROM assignment_groups ag
    JOIN groups g ON g.id = ag.group_id
    WHERE ag.assignment_id = ANY($1::uuid[])
    ORDER BY g.name ASC
  `;

  const { rows } = await db.query(sql, [assignmentIds]);
  return rows;
}

export async function findVisibleForStudent(assignmentId, userId, db = pool) {
  const sql = `
    SELECT
      ${SAFE_ASSIGNMENT_SELECT},
      s.confirmed_at AS group_confirmed_at,
      submitter.full_name AS submitted_by_name
    FROM users u
    JOIN assignments a
      ON a.id = $1
     AND a.is_deleted = FALSE
    LEFT JOIN submissions s
      ON s.assignment_id = a.id
     AND s.group_id = u.group_id
    LEFT JOIN users submitter
      ON submitter.id = s.submitted_by
    WHERE u.id = $2
      AND (
        a.assign_to = 'all'
        OR (
          u.group_id IS NOT NULL
          AND EXISTS (
            SELECT 1
            FROM assignment_groups ag
            WHERE ag.assignment_id = a.id
              AND ag.group_id = u.group_id
          )
        )
      )
  `;

  const { rows } = await db.query(sql, [assignmentId, userId]);
  return rows[0] || null;
}

export async function getAssignmentSubmissions(assignmentId, db = pool) {
  const sql = `
    SELECT
      s.id,
      s.assignment_id,
      s.submitted_by,
      s.group_id,
      s.confirmed_at,
      u.full_name,
      u.email,
      u.student_id AS student_identifier,
      g.name AS group_name
    FROM submissions s
    JOIN users u ON u.id = s.submitted_by
    LEFT JOIN groups g ON g.id = s.group_id
    WHERE s.assignment_id = $1
    ORDER BY s.confirmed_at ASC, u.full_name ASC
  `;

  const { rows } = await db.query(sql, [assignmentId]);
  return rows;
}
