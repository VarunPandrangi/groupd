import mongoose from 'mongoose';

const courseSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      maxlength: 20,
    },
    description: {
      type: String,
      maxlength: 2000,
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    enrolledStudents: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
      ],
      default: [],
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret) => {
        ret._id = ret._id.toString();
        delete ret.__v;
        return ret;
      },
    },
    toObject: {
      transform: (_doc, ret) => {
        ret._id = ret._id.toString();
        delete ret.__v;
        return ret;
      },
    },
  }
);

courseSchema.index({ createdBy: 1 });
courseSchema.index({ enrolledStudents: 1 });

// ---------------------------------------------------------------------------
// Static query helpers (Sprint 2)
// ---------------------------------------------------------------------------

/**
 * Return all non-deleted courses owned by a professor.
 * @param {string|ObjectId} professorId
 */
courseSchema.statics.findByProfessor = function findByProfessor(professorId) {
  return this.find({ createdBy: professorId, isDeleted: false });
};

/**
 * Return all non-deleted courses a student is enrolled in.
 * @param {string|ObjectId} studentId
 */
courseSchema.statics.findByStudent = function findByStudent(studentId) {
  return this.find({ enrolledStudents: studentId, isDeleted: false });
};

/**
 * Check whether a student is enrolled in the given course.
 * @param {string|ObjectId} courseId
 * @param {string|ObjectId} studentId
 * @returns {Promise<boolean>}
 */
courseSchema.statics.isStudentEnrolled = async function isStudentEnrolled(
  courseId,
  studentId
) {
  const course = await this.findOne({
    _id: courseId,
    enrolledStudents: studentId,
    isDeleted: false,
  }).lean();
  return course !== null;
};

/**
 * Check whether the given user is the professor who owns the course.
 * @param {string|ObjectId} courseId
 * @param {string|ObjectId} professorId
 * @returns {Promise<boolean>}
 */
courseSchema.statics.isProfessorOwner = async function isProfessorOwner(
  courseId,
  professorId
) {
  const course = await this.findOne({
    _id: courseId,
    createdBy: professorId,
    isDeleted: false,
  }).lean();
  return course !== null;
};

/**
 * Find a single non-deleted course by its unique course code (case-insensitive
 * because the schema stores codes uppercased).
 * @param {string} code
 */
courseSchema.statics.findByCode = function findByCode(code) {
  return this.findOne({ code: code.toUpperCase(), isDeleted: false });
};

/**
 * Check whether a course code is already taken (including soft-deleted courses
 * to prevent code reuse).
 * @param {string} code
 * @returns {Promise<boolean>}
 */
courseSchema.statics.codeExists = async function codeExists(code) {
  const course = await this.findOne({ code: code.toUpperCase() }).lean();
  return course !== null;
};

export const Course = mongoose.model('Course', courseSchema);