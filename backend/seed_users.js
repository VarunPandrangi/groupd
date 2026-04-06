import { env } from './src/config/env.js';

async function seedStudents() {
  const { register } = await import('./src/services/auth.service.js');
  
  const students = [
    {
      full_name: 'Student One',
      email: 's1@joineazy.com',
      student_id: 'S01',
      password: 'Student@123',
    },
    {
      full_name: 'Student Two',
      email: 's2@joineazy.com',
      student_id: 'S02',
      password: 'Student@123',
    },
    {
      full_name: 'Student Three',
      email: 's3@joineazy.com',
      student_id: 'S03',
      password: 'Student@123',
    }
  ];

  for (const student of students) {
    try {
      await register(student);
      console.log(`Registered user: ${student.email}`);
    } catch (e) {
      console.log(`Failed to register ${student.email}: ${e.message}`);
    }
  }
  process.exit(0);
}

seedStudents();
