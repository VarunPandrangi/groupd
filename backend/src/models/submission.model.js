import mongoose from 'mongoose';

const submissionSchema = new mongoose.Schema(
  {
    assignment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Assignment',
      required: true,
    },
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Group',
      default: null,
    },
    groupNameSnapshot: {
      type: String,
      default: null,
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
    confirmedAt: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ['pending', 'submitted', 'acknowledged'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret) => {
        ret._id = ret._id.toString();
        if (ret.assignment) {
          ret.assignment = ret.assignment.toString();
        }
        if (ret.submittedBy) {
          ret.submittedBy = ret.submittedBy.toString();
        }
        if (ret.group) {
          ret.group = ret.group.toString();
        }
        delete ret.__v;
        return ret;
      },
    },
    toObject: {
      transform: (_doc, ret) => {
        ret._id = ret._id.toString();
        if (ret.assignment) {
          ret.assignment = ret.assignment.toString();
        }
        if (ret.submittedBy) {
          ret.submittedBy = ret.submittedBy.toString();
        }
        if (ret.group) {
          ret.group = ret.group.toString();
        }
        delete ret.__v;
        return ret;
      },
    },
  }
);

submissionSchema.index({ submittedBy: 1 });

submissionSchema.index(
  { assignment: 1, group: 1 },
  {
    unique: true,
    partialFilterExpression: {
      group: { $type: 'objectId' },
    },
  }
);

submissionSchema.index(
  { assignment: 1, submittedBy: 1 },
  {
    unique: true,
    partialFilterExpression: {
      group: null,
    },
  }
);

// ---------------------------------------------------------------------------
// Static query helpers (Sprint 3)
// ---------------------------------------------------------------------------

/**
 * Find an individual submission (group: null) by assignment and student.
 * Returns null if no such submission exists.
 * @param {string|ObjectId} assignmentId
 * @param {string|ObjectId} studentId
 * @returns {Promise<Document|null>}
 */
submissionSchema.statics.findByAssignmentAndStudent = function findByAssignmentAndStudent(
  assignmentId,
  studentId
) {
  return this.findOne({
    assignment: assignmentId,
    submittedBy: studentId,
    group: null,
  });
};

export const Submission = mongoose.model('Submission', submissionSchema);
