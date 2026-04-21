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

// ---------------------------------------------------------------------------
// Static query helpers (Sprint 2)
// ---------------------------------------------------------------------------

/**
 * Check whether the given user is the leader (createdBy) of the group.
 * Returns false for deleted groups — callers should handle that separately
 * if they need a distinct "group deleted" error.
 * @param {string|ObjectId} groupId
 * @param {string|ObjectId} userId
 * @returns {Promise<boolean>}
 */
groupSchema.statics.isLeader = async function isLeader(groupId, userId) {
  const group = await this.findById(groupId).lean();
  if (!group) return false;
  return group.createdBy.toString() === userId.toString();
};

export const Group = mongoose.model('Group', groupSchema);