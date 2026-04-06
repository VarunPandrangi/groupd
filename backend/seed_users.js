import { env } from './src/config/env.js';
import { pool } from './src/config/database.js';
import { hashPassword } from './src/utils/password.js';

async function seedStudents() {
  const students = Array.from({ length: 15 }, (_, index) => {
    const studentNumber = index + 1;
    return {
      full_name: `Student ${studentNumber}`,
      email: `s${studentNumber}@joineazy.com`,
      student_id: `S${String(studentNumber).padStart(2, '0')}`,
      password: 'test@123',
    };
  });

  for (const student of students) {
    try {
      const password_hash = await hashPassword(student.password);
      await pool.query(
        `
          INSERT INTO users (full_name, email, student_id, password_hash, role)
          VALUES ($1, $2, $3, $4, 'student')
          ON CONFLICT (email) DO UPDATE
          SET
            full_name = EXCLUDED.full_name,
            student_id = EXCLUDED.student_id,
            password_hash = EXCLUDED.password_hash,
            role = EXCLUDED.role,
            updated_at = NOW()
        `,
        [
          student.full_name,
          student.email,
          student.student_id,
          password_hash,
        ]
      );
      console.log(`Synced user: ${student.email}`);
    } catch (e) {
      console.log(`Failed to sync ${student.email}: ${e.message}`);
    }
  }

  await pool.end();
  process.exit(0);
}

seedStudents();
