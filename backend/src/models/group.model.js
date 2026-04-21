import mongoose from 'mongoose';

const groupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    description: {
      type: String,
      maxlength: 200,
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    members: {
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

groupSchema.index({ createdBy: 1 });
groupSchema.index({ members: 1 });

export const Group = mongoose.model('Group', groupSchema);