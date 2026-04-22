import { Assignment } from '../models/assignment.model.js';
import { Course } from '../models/course.model.js';
import { Group } from '../models/group.model.js';
import { Submission } from '../models/submission.model.js';
import { User } from '../models/user.model.js';

const httpError = (statusCode, code, message) =>
  Object.assign(new Error(message), { statusCode, code });

function toNumber(value, fallback = 0) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) {
    return fallback;
  }

  return numericValue;
}

function roundPercentage(value) {
  return Number(toNumber(value).toFixed(2));
}

function computeStatus(dueDate) {
  const due = new Date(dueDate).getTime();
  const now = Date.now();
  const threeDays = 3 * 24 * 60 * 60 * 1000;

  if (due <= now) {
    return 'overdue';
  }

  if (due <= now + threeDays) {
    return 'active';
  }

  return 'upcoming';
}

async function findStudentGroup(userId) {
  return Group.findOne({
    members: userId,
    isDeleted: false,
  }).lean();
}

function formatStudentDashboard(dashboard) {
  if (!dashboard.group) {
    return {
      group: null,
      totalAssignments: null,
      submittedCount: null,
      pendingCount: null,
      upcomingDeadlines: [],
    };
  }

  return {
    group: {
      ...dashboard.group,
      members: Array.isArray(dashboard.group.members)
        ? dashboard.group.members
        : [],
    },
    totalAssignments: toNumber(dashboard.totalAssignments, 0),
    submittedCount: toNumber(dashboard.submittedCount, 0),
    pendingCount: toNumber(dashboard.pendingCount, 0),
    upcomingDeadlines: dashboard.upcomingDeadlines ?? [],
  };
}

export async function getStudentDashboard(userId) {
  const user = await User.findOne({ _id: userId, isDeleted: false }).lean();

  if (!user) {
    throw httpError(404, 'USER_NOT_FOUND', 'User not found');
  }

  const group = await findStudentGroup(user._id);

  if (!group) {
    return formatStudentDashboard({ group: null });
  }

  const memberUsers = await User.find({
    _id: { $in: group.members },
    isDeleted: false,
  })
    .sort({ fullName: 1 })
    .lean();

  const members = memberUsers
    .sort((a, b) => {
      if (a._id.toString() === group.createdBy.toString()) {
        return -1;
      }
      if (b._id.toString() === group.createdBy.toString()) {
        return 1;
      }

      return a.fullName.localeCompare(b.fullName);
    })
    .map((member) => ({
      id: member._id.toString(),
      full_name: member.fullName,
      email: member.email,
      student_id: member.studentId ?? null,
    }));

  const enrolledCourseIds = (
    await Course.findByStudent(user._id).select('_id').lean()
  ).map((course) => course._id);

  const assignments = await Assignment.find({
    isDeleted: false,
    course: { $in: enrolledCourseIds },
    $or: [{ assignTo: 'all' }, { assignTo: 'group', groupTargets: group._id }],
  })
    .sort({ dueDate: 1, createdAt: -1 })
    .lean();

  const assignmentIds = assignments.map((assignment) => assignment._id);
  const submissions = await Submission.find({
    assignment: { $in: assignmentIds },
    group: group._id,
  })
    .select('assignment')
    .lean();

  const submittedAssignmentIds = new Set(
    submissions.map((submission) => submission.assignment.toString())
  );

  const upcomingDeadlines = assignments
    .filter((assignment) => !submittedAssignmentIds.has(assignment._id.toString()))
    .slice(0, 5)
    .map((assignment) => ({
      id: assignment._id.toString(),
      title: assignment.title,
      due_date: assignment.dueDate,
      status: computeStatus(assignment.dueDate),
    }));

  return formatStudentDashboard({
    group: {
      id: group._id.toString(),
      name: group.name,
      description: group.description ?? null,
      created_by: group.createdBy.toString(),
      created_at: group.createdAt,
      updated_at: group.updatedAt,
      members,
    },
    totalAssignments: assignments.length,
    submittedCount: submittedAssignmentIds.size,
    pendingCount: Math.max(assignments.length - submittedAssignmentIds.size, 0),
    upcomingDeadlines,
  });
}

export async function getAdminSummary() {
  const [totalStudents, totalGroups, assignments] = await Promise.all([
    User.countDocuments({ role: 'student', isDeleted: false }),
    Group.countDocuments({ isDeleted: false }),
    Assignment.find({ isDeleted: false }).select('_id assignTo groupTargets').lean(),
  ]);

  let totalPairs = 0;
  let totalSubmissions = 0;

  for (const assignment of assignments) {
    const groupsAssigned =
      assignment.assignTo === 'all'
        ? totalGroups
        : assignment.groupTargets.length;

    const submissionCount = await Submission.countDocuments({
      assignment: assignment._id,
      status: { $in: ['submitted', 'acknowledged'] },
    });

    totalPairs += groupsAssigned;
    totalSubmissions += submissionCount;
  }

  return {
    totalStudents: toNumber(totalStudents, 0),
    totalGroups: toNumber(totalGroups, 0),
    totalAssignments: toNumber(assignments.length, 0),
    overallCompletionRate:
      totalPairs === 0 ? 0 : roundPercentage((totalSubmissions / totalPairs) * 100),
  };
}

export async function getAssignmentAnalytics() {
  const [totalGroups, assignments] = await Promise.all([
    Group.countDocuments({ isDeleted: false }),
    Assignment.find({ isDeleted: false })
      .sort({ dueDate: -1, createdAt: -1 })
      .lean(),
  ]);

  const rows = [];

  for (const assignment of assignments) {
    const groupsAssigned =
      assignment.assignTo === 'all'
        ? totalGroups
        : assignment.groupTargets.length;

    const groupsSubmitted = await Submission.countDocuments({
      assignment: assignment._id,
      status: { $in: ['submitted', 'acknowledged'] },
    });

    rows.push({
      id: assignment._id.toString(),
      title: assignment.title,
      due_date: assignment.dueDate,
      status: computeStatus(assignment.dueDate),
      groups_submitted: toNumber(groupsSubmitted, 0),
      groups_assigned: toNumber(groupsAssigned, 0),
      completion_rate:
        groupsAssigned === 0
          ? 0
          : roundPercentage((groupsSubmitted / groupsAssigned) * 100),
    });
  }

  return rows;
}

export async function getGroupAnalytics() {
  const [groups, assignments, submissions] = await Promise.all([
    Group.find({ isDeleted: false }).lean(),
    Assignment.find({ isDeleted: false }).lean(),
    Submission.find({ status: { $in: ['submitted', 'acknowledged'] } })
      .populate('group', 'name isDeleted')
      .lean(),
  ]);

  const submissionsByGroupId = new Map();
  const deletedGroupSubmissionCounts = new Map();

  for (const submission of submissions) {
    const isDeletedGroup = !submission.group || submission.group.isDeleted;

    if (isDeletedGroup) {
      const name = submission.group?.name || submission.groupNameSnapshot || 'Unknown Group';
      deletedGroupSubmissionCounts.set(
        name,
        (deletedGroupSubmissionCounts.get(name) ?? 0) + 1
      );
      continue;
    }

    const groupId = submission.group._id.toString();
    submissionsByGroupId.set(groupId, (submissionsByGroupId.get(groupId) ?? 0) + 1);
  }

  const liveRows = groups.map((group) => {
    const totalAssignments = assignments.filter((assignment) => {
      if (assignment.assignTo === 'all') {
        return true;
      }

      return assignment.groupTargets
        .map((groupId) => groupId.toString())
        .includes(group._id.toString());
    }).length;

    const submittedAssignments = submissionsByGroupId.get(group._id.toString()) ?? 0;

    return {
      id: group._id.toString(),
      name: group.name,
      group_deleted: false,
      member_count: toNumber(group.members.length, 0),
      total_assignments: toNumber(totalAssignments, 0),
      submitted_assignments: toNumber(submittedAssignments, 0),
      completion_rate:
        totalAssignments === 0
          ? 0
          : roundPercentage((submittedAssignments / totalAssignments) * 100),
    };
  });

  const deletedRows = [...deletedGroupSubmissionCounts.entries()].map(
    ([name, submittedAssignments]) => ({
      id: null,
      name,
      group_deleted: true,
      member_count: 0,
      total_assignments: submittedAssignments,
      submitted_assignments: submittedAssignments,
      completion_rate: submittedAssignments > 0 ? 100 : 0,
    })
  );

  return [...liveRows, ...deletedRows]
    .filter((row) => !row.group_deleted || row.submitted_assignments > 0)
    .sort((a, b) => {
      if (a.completion_rate !== b.completion_rate) {
        return b.completion_rate - a.completion_rate;
      }

      if (a.group_deleted !== b.group_deleted) {
        return Number(a.group_deleted) - Number(b.group_deleted);
      }

      return a.name.localeCompare(b.name);
    });
}
