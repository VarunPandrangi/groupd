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

export const Course = mongoose.model('Course', courseSchema);