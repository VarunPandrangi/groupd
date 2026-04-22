import mongoose from 'mongoose';

const assignmentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: false,
      default: '',
    },
    dueDate: {
      type: Date,
      required: true,
    },
    onedriveLink: {
      type: String,
      default: null,
      trim: true,
    },
    assignTo: {
      type: String,
      enum: ['all', 'group'],
      default: 'all',
    },
    submissionType: {
      type: String,
      enum: ['individual', 'group'],
      default: 'group',
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    groupTargets: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Group',
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

assignmentSchema.index({ course: 1 });
assignmentSchema.index({ createdBy: 1 });
assignmentSchema.index({ dueDate: 1 });

export const Assignment = mongoose.model('Assignment', assignmentSchema);
