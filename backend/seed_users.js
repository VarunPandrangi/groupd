import mongoose from 'mongoose';

import { connectDB } from './src/config/database.js';
import { User } from './src/models/user.model.js';

async function seedStudents() {
  const students = Array.from({ length: 15 }, (_, index) => {
    const studentNumber = index + 1;

    return {
      full_name: `Student ${studentNumber}`,
      email: `s${studentNumber}@groupd.com`,
      student_id: `S${String(studentNumber).padStart(2, '0')}`,
      password: 'test@123',
    };
  });

  try {
    await connectDB();

    for (const student of students) {
      try {
        const existing = await User.findOne({ email: student.email.toLowerCase() });

        if (!existing) {
          await User.create({
            fullName: student.full_name,
            email: student.email,
            studentId: student.student_id,
            password: student.password,
            role: 'student',
          });
        } else {
          existing.fullName = student.full_name;
          existing.studentId = student.student_id;
          existing.role = 'student';
          existing.isDeleted = false;
          existing.password = student.password;
          await existing.save();
        }

        // eslint-disable-next-line no-console
        console.log(`Synced user: ${student.email}`);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.log(`Failed to sync ${student.email}: ${err.message}`);
      }
    }
  } finally {
    await mongoose.disconnect();
  }
}

seedStudents();