import mongoose from 'mongoose';

import { connectDB } from '../config/database.js';
import { Assignment } from '../models/assignment.model.js';
import { Course } from '../models/course.model.js';
import { User } from '../models/user.model.js';
import { logger } from '../utils/logger.js';

async function seed() {
  try {
    await connectDB();

    let admin = await User.findByEmail('admin@joineazy.com');
    if (!admin) {
      admin = await User.create({
        fullName: 'Admin',
        email: 'admin@joineazy.com',
        password: 'Admin@123',
        role: 'admin',
      });
    }

    let legacyCourse = await Course.findOne({
      code: 'LEGACY-001',
      isDeleted: false,
    });

    if (!legacyCourse) {
      legacyCourse = await Course.create({
        name: 'Legacy Course',
        code: 'LEGACY-001',
        description: 'Auto-created for existing assignments',
        createdBy: admin._id,
      });
    }

    const students = await User.find({
      role: 'student',
      isDeleted: false,
    })
      .select('_id')
      .lean();

    legacyCourse.enrolledStudents = [
      ...new Set([
        ...legacyCourse.enrolledStudents.map((id) => id.toString()),
        ...students.map((student) => student._id.toString()),
      ]),
    ];

    await legacyCourse.save();

    await Assignment.updateMany(
      {
        $or: [{ course: null }, { course: { $exists: false } }],
      },
      {
        $set: {
          course: legacyCourse._id,
        },
      }
    );

    logger.info('Seed complete');
  } catch (err) {
    logger.error('Seed failed', err);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

seed();