import { pool } from '../config/database.js';

const SAFE_GROUP_COLUMNS = `
  id,
  name,
  description,
  created_by,
  created_at,
  updated_at
`;

const SAFE_USER_COLUMNS = `
  id,
  full_name,
  email,
  student_id,
  role,
  group_id,
  created_at,
  updated_at
`;

export async function createGroup(
  { name, description, created_by },
  db = pool
) {
  const sql = `
    INSERT INTO groups (name, description, created_by)
    VALUES ($1, $2, $3)
    RETURNING ${SAFE_GROUP_COLUMNS}
  `;
  const { rows } = await db.query(sql, [name, description ?? null, created_by]);
  return rows[0];
}

export async function findById(id, db = pool) {
  const sql = `SELECT ${SAFE_GROUP_COLUMNS} FROM groups WHERE id = $1`;
  const { rows } = await db.query(sql, [id]);
  return rows[0] || null;
}

export async function findByName(name, db = pool) {
  const sql = `
    SELECT ${SAFE_GROUP_COLUMNS}
    FROM groups
    WHERE LOWER(name) = LOWER($1)
  `;
  const { rows } = await db.query(sql, [name]);
  return rows[0] || null;
}

export async function nameExists(name, db = pool) {
  const { rowCount } = await db.query(
    'SELECT 1 FROM groups WHERE LOWER(name) = LOWER($1)',
    [name]
  );
  return rowCount > 0;
}

export async function getGroupMembers(groupId, db = pool) {
  const sql = `
    SELECT id, full_name, email, student_id
    FROM users
    WHERE group_id = $1
  `;
  const { rows } = await db.query(sql, [groupId]);
  return rows;
}

export async function getAllGroups(page, limit, db = pool) {
  const offset = (page - 1) * limit;

  const listSql = `
    SELECT
      g.id,
      g.name,
      g.description,
      g.created_by,
      g.created_at,
      g.updated_at,
      (
        SELECT COUNT(*)
        FROM users u
        WHERE u.group_id = g.id
      ) AS member_count
    FROM groups g
    ORDER BY g.created_at DESC, g.name ASC
    LIMIT $1 OFFSET $2
  `;

  const totalSql = 'SELECT COUNT(*) AS total FROM groups';

  const [listResult, totalResult] = await Promise.all([
    db.query(listSql, [limit, offset]),
    db.query(totalSql),
  ]);

  const total = Number(totalResult.rows[0].total);
  const groups = listResult.rows.map((row) => ({
    ...row,
    member_count: Number(row.member_count),
  }));

  return {
    groups,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
}

export async function deleteGroup(groupId, db = pool) {
  const sql = `
    DELETE FROM groups
    WHERE id = $1
    RETURNING ${SAFE_GROUP_COLUMNS}
  `;
  const { rows } = await db.query(sql, [groupId]);
  return rows[0] || null;
}

export async function countGroupMembers(groupId, db = pool) {
  const { rows } = await db.query(
    'SELECT COUNT(*) AS count FROM users WHERE group_id = $1',
    [groupId]
  );
  return Number(rows[0].count);
}

export async function assignUserToGroupIfUnassigned(
  userId,
  groupId,
  db = pool
) {
  const sql = `
    UPDATE users
    SET group_id = $1, updated_at = NOW()
    WHERE id = $2
      AND group_id IS NULL
    RETURNING ${SAFE_USER_COLUMNS}
  `;
  const { rows } = await db.query(sql, [groupId, userId]);
  return rows[0] || null;
}

export async function removeUserFromGroup(userId, groupId, db = pool) {
  const sql = `
    UPDATE users
    SET group_id = NULL, updated_at = NOW()
    WHERE id = $1
      AND group_id = $2
    RETURNING ${SAFE_USER_COLUMNS}
  `;
  const { rows } = await db.query(sql, [userId, groupId]);
  return rows[0] || null;
}

export async function releaseAllGroupMembers(groupId, db = pool) {
  const sql = `
    UPDATE users
    SET group_id = NULL, updated_at = NOW()
    WHERE group_id = $1
  `;
  const result = await db.query(sql, [groupId]);
  return result.rowCount;
}
