import { pool } from '../config/database.js';

/**
 * Column list returned to callers that must NOT see the password hash.
 * Used by every read path except login.
 */
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

/**
 * Insert a new user and return the row WITHOUT password_hash.
 */
export async function createUser(
  {
  full_name,
  email,
  student_id,
  password_hash,
  role,
  },
  db = pool
) {
  const sql = `
    INSERT INTO users (full_name, email, student_id, password_hash, role)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING ${SAFE_USER_COLUMNS}
  `;
  const { rows } = await db.query(sql, [
    full_name,
    email,
    student_id,
    password_hash,
    role,
  ]);
  return rows[0];
}

/**
 * Find user by email INCLUDING password_hash.
 * Callers outside auth MUST strip password_hash before returning data.
 */
export async function findByEmail(email, db = pool) {
  const sql = `
    SELECT
      id,
      full_name,
      email,
      student_id,
      password_hash,
      role,
      group_id,
      created_at,
      updated_at
    FROM users
    WHERE email = $1
  `;
  const { rows } = await db.query(sql, [email]);
  return rows[0] || null;
}

/**
 * Find user by id WITHOUT password_hash.
 */
export async function findById(id, db = pool) {
  const sql = `SELECT ${SAFE_USER_COLUMNS} FROM users WHERE id = $1`;
  const { rows } = await db.query(sql, [id]);
  return rows[0] || null;
}

/**
 * Find user by student_id WITHOUT password_hash.
 */
export async function findByStudentId(student_id, db = pool) {
  const sql = `SELECT ${SAFE_USER_COLUMNS} FROM users WHERE student_id = $1`;
  const { rows } = await db.query(sql, [student_id]);
  return rows[0] || null;
}

export async function emailExists(email, db = pool) {
  const { rowCount } = await db.query(
    'SELECT 1 FROM users WHERE email = $1',
    [email]
  );
  return rowCount > 0;
}

export async function studentIdExists(student_id, db = pool) {
  const { rowCount } = await db.query(
    'SELECT 1 FROM users WHERE student_id = $1',
    [student_id]
  );
  return rowCount > 0;
}
