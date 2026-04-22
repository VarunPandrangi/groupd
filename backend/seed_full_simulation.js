import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mongoose from 'mongoose';

import { connectDB } from './src/config/database.js';
import { Assignment } from './src/models/assignment.model.js';
import { Course } from './src/models/course.model.js';
import { Group } from './src/models/group.model.js';
import { Submission } from './src/models/submission.model.js';
import { User } from './src/models/user.model.js';
import * as assignmentService from './src/services/assignment.service.js';
import * as submissionService from './src/services/submission.service.js';

const STUDENT_COUNT = 75;
const GROUP_COUNT = 12;
const GROUP_SIZE = 5;
const GROUPED_STUDENT_COUNT = GROUP_COUNT * GROUP_SIZE;
const GROUP_ASSIGNMENTS_PER_COURSE = 4;
const INDIVIDUAL_ASSIGNMENTS_PER_COURSE = 3;

const COURSE_TEMPLATES = [
  {
    name: 'Introduction to Computer Science',
    code: 'CS101',
    description: 'Programming basics, algorithms, and computational thinking.',
  },
  {
    name: 'Data Structures and Algorithms',
    code: 'CS201',
    description: 'Core data structures, complexity, and algorithm design.',
  },
  {
    name: 'Database Systems',
    code: 'CS220',
    description: 'Relational modeling, SQL, normalization, and indexing.',
  },
  {
    name: 'Software Engineering',
    code: 'CS250',
    description: 'Requirements, architecture, versioning, and team workflows.',
  },
  {
    name: 'Web Application Development',
    code: 'CS310',
    description: 'Frontend-backend integration and production-ready web systems.',
  },
  {
    name: 'Cloud and DevOps Fundamentals',
    code: 'CS330',
    description: 'Containers, CI/CD, monitoring, and scalable deployments.',
  },
];

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPORT_PATH = path.resolve(__dirname, '..', 'SIMULATION_REPORT.md');

let rngSeed = 20260422;

function random() {
  rngSeed = (rngSeed * 1664525 + 1013904223) >>> 0;
  return rngSeed / 4294967296;
}

function randInt(min, max) {
  return Math.floor(random() * (max - min + 1)) + min;
}

function normalizeId(value) {
  return value.toString();
}

function extractId(value) {
  if (value && typeof value === 'object' && value._id) {
    return normalizeId(value._id);
  }

  return normalizeId(value);
}

function makeDueDate(offsetDays) {
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + offsetDays);
  dueDate.setHours(23, 59, 0, 0);
  return dueDate.toISOString();
}

function shuffle(items) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = randInt(0, index);
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
}

function sample(items, count) {
  if (count <= 0) {
    return [];
  }

  if (count >= items.length) {
    return [...items];
  }

  return shuffle(items).slice(0, count);
}

function pickSubmittedSubset(items, minRatio, maxRatio) {
  if (items.length === 0 || random() < 0.18) {
    return [];
  }

  const ratio = minRatio + random() * (maxRatio - minRatio);
  const count = Math.max(1, Math.floor(items.length * ratio));
  return sample(items, count);
}

function escapeCell(value) {
  return String(value ?? '')
    .replace(/\|/g, '\\|')
    .replace(/\r?\n/g, ' ')
    .trim();
}

function markdownTable(headers, rows) {
  const headerRow = `| ${headers.map(escapeCell).join(' | ')} |`;
  const separatorRow = `| ${headers.map(() => '---').join(' | ')} |`;
  const bodyRows = rows.map(
    (row) => `| ${row.map((cell) => escapeCell(cell)).join(' | ')} |`
  );

  return [headerRow, separatorRow, ...bodyRows].join('\n');
}

function isGroupFullyEnrolled(group, enrollmentSet) {
  const memberIds = (group.members ?? []).map(normalizeId);
  return memberIds.every((memberId) => enrollmentSet.has(memberId));
}

function getEnrolledCourseCodesForUser(userId, courses, enrollmentByCourseId) {
  return courses
    .filter((course) =>
      (enrollmentByCourseId.get(normalizeId(course._id)) ?? new Set()).has(userId)
    )
    .map((course) => course.code)
    .sort((left, right) => left.localeCompare(right));
}

async function resetData() {
  await Promise.all([
    Submission.deleteMany({}),
    Assignment.deleteMany({}),
    Group.deleteMany({}),
    Course.deleteMany({}),
    User.deleteMany({}),
  ]);
}

async function createUsers() {
  const admin = await User.create({
    fullName: 'Groupd Admin',
    email: 'admin@groupd.com',
    password: 'test@123',
    role: 'admin',
  });

  const studentPayload = Array.from({ length: STUDENT_COUNT }, (_value, index) => {
    const number = index + 1;

    return {
      fullName: `Student ${number}`,
      email: `s${number}@groupd.com`,
      studentId: `S${String(number).padStart(2, '0')}`,
      password: 'test@123',
      role: 'student',
    };
  });

  const students = await User.create(studentPayload);
  return { admin, students };
}

async function createCourses(adminId) {
  return Course.create(
    COURSE_TEMPLATES.map((course) => ({
      ...course,
      createdBy: adminId,
    }))
  );
}

async function createGroups(students) {
  const shuffledStudents = shuffle(students);
  const groupedStudents = shuffledStudents.slice(0, GROUPED_STUDENT_COUNT);
  const ungroupedStudents = shuffledStudents.slice(GROUPED_STUDENT_COUNT);

  const groups = await Group.create(
    Array.from({ length: GROUP_COUNT }, (_value, index) => {
      const start = index * GROUP_SIZE;
      const members = groupedStudents.slice(start, start + GROUP_SIZE);

      return {
        name: `Team-${String(index + 1).padStart(2, '0')}`,
        description: `Simulation group ${index + 1}`,
        createdBy: members[0]._id,
        members: members.map((student) => student._id),
      };
    })
  );

  return { groups, ungroupedStudents };
}

function buildEnrollmentMap(courses, groups, ungroupedStudents) {
  const courseIds = courses.map((course) => normalizeId(course._id));
  const enrollmentByCourseId = new Map(
    courseIds.map((courseId) => [courseId, new Set()])
  );

  groups.forEach((group, groupIndex) => {
    const anchorCourseIds = [
      courseIds[groupIndex % courseIds.length],
      courseIds[(groupIndex + 1) % courseIds.length],
    ];

    (group.members ?? []).forEach((memberId) => {
      const normalizedMemberId = normalizeId(memberId);

      anchorCourseIds.forEach((courseId) => {
        enrollmentByCourseId.get(courseId).add(normalizedMemberId);
      });

      const desiredCourseCount = random() < 0.45 ? 4 : 3;
      const extraCourseIds = sample(
        courseIds.filter((courseId) => !anchorCourseIds.includes(courseId)),
        Math.max(desiredCourseCount - anchorCourseIds.length, 0)
      );

      extraCourseIds.forEach((courseId) => {
        enrollmentByCourseId.get(courseId).add(normalizedMemberId);
      });
    });
  });

  ungroupedStudents.forEach((student) => {
    const desiredCourseCount = random() < 0.5 ? 3 : 2;
    sample(courseIds, desiredCourseCount).forEach((courseId) => {
      enrollmentByCourseId.get(courseId).add(normalizeId(student._id));
    });
  });

  return enrollmentByCourseId;
}

function enforceMembershipEdgeScenario(courses, groups, enrollmentByCourseId) {
  const edgeGroup = groups[0] ?? null;
  const edgeCourse = courses[2] ?? null;

  if (!edgeGroup || !edgeCourse) {
    return null;
  }

  const courseId = normalizeId(edgeCourse._id);
  const enrollmentSet = enrollmentByCourseId.get(courseId);
  if (!enrollmentSet) {
    return null;
  }

  const memberIds = (edgeGroup.members ?? []).map(normalizeId);
  const leaderId = normalizeId(edgeGroup.createdBy);
  const nonLeaderMemberIds = memberIds.filter((memberId) => memberId !== leaderId);
  const forcedUnenrolledMemberIds = nonLeaderMemberIds.slice(0, 2);

  enrollmentSet.add(leaderId);
  forcedUnenrolledMemberIds.forEach((memberId) => enrollmentSet.delete(memberId));

  return {
    courseId,
    groupId: normalizeId(edgeGroup._id),
    leaderId,
    forcedUnenrolledMemberIds,
  };
}

async function persistCourseEnrollments(courses, enrollmentByCourseId) {
  await Promise.all(
    courses.map((course) =>
      Course.updateOne(
        { _id: course._id },
        {
          $set: {
            enrolledStudents: [...(enrollmentByCourseId.get(normalizeId(course._id)) ?? new Set())],
          },
        }
      )
    )
  );
}

function getEligibleGroupsForCourse(groups, enrollmentSet) {
  return groups.filter((group) => isGroupFullyEnrolled(group, enrollmentSet));
}

async function createAssignments(adminId, courses, groups, enrollmentByCourseId) {
  const assignments = [];

  for (const [courseIndex, course] of courses.entries()) {
    const courseId = normalizeId(course._id);
    const enrollmentSet = enrollmentByCourseId.get(courseId) ?? new Set();
    const eligibleGroups = getEligibleGroupsForCourse(groups, enrollmentSet);

    if (eligibleGroups.length === 0) {
      throw new Error(`No eligible groups available for course ${course.code}`);
    }

    for (let index = 0; index < GROUP_ASSIGNMENTS_PER_COURSE; index += 1) {
      const targetCount = Math.min(
        eligibleGroups.length,
        Math.max(1, randInt(2, Math.min(5, eligibleGroups.length)))
      );
      const targetGroups = sample(eligibleGroups, targetCount);

      assignments.push(
        await assignmentService.create(adminId, {
          title: `${course.code} Group Assignment ${index + 1}`,
          description: `Collaborative deliverable ${index + 1} for ${course.name}.`,
          due_date: makeDueDate(6 + courseIndex * 3 + index * 4),
          onedrive_link: `https://onedrive.live.com/${course.code.toLowerCase()}-group-${index + 1}`,
          assign_to: 'specific',
          group_ids: targetGroups.map((group) => normalizeId(group._id)),
          submission_type: 'group',
          course_id: courseId,
        })
      );
    }

    for (let index = 0; index < INDIVIDUAL_ASSIGNMENTS_PER_COURSE; index += 1) {
      assignments.push(
        await assignmentService.create(adminId, {
          title: `${course.code} Individual Assignment ${index + 1}`,
          description: `Individual deliverable ${index + 1} for ${course.name}.`,
          due_date: makeDueDate(5 + courseIndex * 3 + index * 5),
          onedrive_link: `https://onedrive.live.com/${course.code.toLowerCase()}-individual-${index + 1}`,
          assign_to: 'all',
          submission_type: 'individual',
          course_id: courseId,
        })
      );
    }
  }

  return assignments;
}

async function createRandomSubmissions(
  assignments,
  groups,
  studentsById,
  enrollmentByCourseId
) {
  const groupsById = new Map(groups.map((group) => [normalizeId(group._id), group]));
  const submissions = [];

  for (const assignment of assignments) {
    if (assignment.submission_type === 'group') {
      const eligibleGroups =
        assignment.assign_to === 'all'
          ? groups
          : (assignment.groups ?? [])
              .map((groupSummary) => groupsById.get(groupSummary.id))
              .filter(Boolean);

      const submittedGroups = pickSubmittedSubset(eligibleGroups, 0.3, 0.68);

      for (const group of submittedGroups) {
        const confirmation = await submissionService.prepareSubmissionConfirmation(
          group.createdBy,
          assignment.id
        );
        const submission = await submissionService.confirmSubmission(
          group.createdBy,
          assignment.id,
          confirmation.confirmation_token
        );

        submissions.push(submission);
      }

      continue;
    }

    const enrolledStudentIds = [
      ...(enrollmentByCourseId.get(assignment.course_id) ?? new Set()),
    ];
    const eligibleStudents = enrolledStudentIds
      .map((studentId) => studentsById.get(studentId))
      .filter(Boolean);
    const submittedStudents = pickSubmittedSubset(eligibleStudents, 0.25, 0.6);

    for (const student of submittedStudents) {
      const confirmation = await submissionService.prepareSubmissionConfirmation(
        student._id,
        assignment.id
      );
      const submission = await submissionService.confirmSubmission(
        student._id,
        assignment.id,
        confirmation.confirmation_token
      );

      submissions.push(submission);
    }
  }

  return submissions;
}

async function expectErrorCase(label, expectedCode, execute) {
  try {
    await execute();

    return {
      case: label,
      status: 'FAIL',
      expected: expectedCode,
      actual: 'NO_ERROR',
      details: 'Operation unexpectedly succeeded.',
    };
  } catch (error) {
    const actualCode =
      error?.code ??
      error?.response?.data?.error?.code ??
      error?.statusCode ??
      'UNKNOWN_ERROR';

    return {
      case: label,
      status: actualCode === expectedCode ? 'PASS' : 'FAIL',
      expected: expectedCode,
      actual: actualCode,
      details: error?.message ?? 'Validation failed with an unexpected shape.',
    };
  }
}

async function expectSuccessCase(label, execute) {
  try {
    const result = await execute();

    return {
      case: label,
      status: 'PASS',
      expected: 'SUCCESS',
      actual: 'SUCCESS',
      details: result ?? 'Operation succeeded.',
    };
  } catch (error) {
    const actualCode =
      error?.code ??
      error?.response?.data?.error?.code ??
      error?.statusCode ??
      'UNKNOWN_ERROR';

    return {
      case: label,
      status: 'FAIL',
      expected: 'SUCCESS',
      actual: actualCode,
      details: error?.message ?? 'Operation failed.',
    };
  }
}

async function expectHiddenAssignmentCase(label, studentId, assignmentId) {
  const visibleAssignments = await assignmentService.getForStudent(studentId);
  const visibleInList = visibleAssignments.some(
    (assignment) => assignment.id === normalizeId(assignmentId)
  );

  let detailCode = 'NO_ERROR';
  try {
    await assignmentService.getDetail(assignmentId, {
      userId: studentId,
      role: 'student',
    });
  } catch (error) {
    detailCode =
      error?.code ??
      error?.response?.data?.error?.code ??
      error?.statusCode ??
      'UNKNOWN_ERROR';
  }

  return {
    case: label,
    status: !visibleInList && detailCode === 'NOT_ENROLLED' ? 'PASS' : 'FAIL',
    expected: 'LIST_HIDDEN + NOT_ENROLLED',
    actual: `visible_in_list=${visibleInList}; detail=${detailCode}`,
    details: !visibleInList
      ? 'Assignment was absent from the student assignment list.'
      : 'Assignment was visible when it should have been hidden.',
  };
}

async function findUngroupedIndividualSubmissionScenario(
  ungroupedStudents,
  assignments,
  enrollmentByCourseId
) {
  for (const student of ungroupedStudents) {
    const studentId = normalizeId(student._id);
    const enrolledCourseIds = [...enrollmentByCourseId.entries()]
      .filter(([_courseId, students]) => students.has(studentId))
      .map(([courseId]) => courseId)
      .sort((left, right) => left.localeCompare(right));

    for (const courseId of enrolledCourseIds) {
      const candidateAssignments = assignments.filter(
        (assignment) =>
          assignment.course_id === courseId &&
          assignment.submission_type === 'individual'
      );

      for (const assignment of candidateAssignments) {
        const existingSubmission = await Submission.exists({
          assignment: assignment.id,
          submittedBy: student._id,
          group: null,
        });

        if (!existingSubmission) {
          return { student, assignment };
        }
      }
    }
  }

  return null;
}

async function runValidationChecks({
  admin,
  assignments,
  courses,
  edgeScenario,
  enrollmentByCourseId,
  groups,
  studentsById,
  ungroupedStudents,
}) {
  const results = [];
  const edgeCourse = courses.find(
    (course) => normalizeId(course._id) === edgeScenario.courseId
  );
  const edgeGroup = groups.find(
    (group) => normalizeId(group._id) === edgeScenario.groupId
  );
  const edgeEnrollmentSet = enrollmentByCourseId.get(edgeScenario.courseId) ?? new Set();
  const nonEnrolledStudent = studentsById.get(edgeScenario.forcedUnenrolledMemberIds[0]);
  const edgeIndividualAssignment = assignments.find(
    (assignment) =>
      assignment.course_id === edgeScenario.courseId &&
      assignment.submission_type === 'individual'
  );

  if (!edgeCourse || !edgeGroup || !nonEnrolledStudent || !edgeIndividualAssignment) {
    throw new Error('Unable to resolve required edge-case fixtures.');
  }

  const assignmentCountBeforeCase1 = await Assignment.countDocuments({});
  const case1 = await expectErrorCase(
    'Case 1 - group assignment creation rejects non-enrolled member',
    'GROUP_MEMBERS_NOT_ENROLLED',
    () =>
      assignmentService.create(admin._id, {
        title: `Validation Probe ${edgeCourse.code} A`,
        description: 'Expected to fail because one target member is not enrolled.',
        due_date: makeDueDate(21),
        onedrive_link: 'https://onedrive.live.com/validation-case-1',
        assign_to: 'specific',
        group_ids: [normalizeId(edgeGroup._id)],
        submission_type: 'group',
        course_id: edgeScenario.courseId,
      })
  );
  const assignmentCountAfterCase1 = await Assignment.countDocuments({});
  case1.details = `${case1.details} Assignment count ${assignmentCountBeforeCase1} -> ${assignmentCountAfterCase1}.`;
  results.push(case1);

  results.push(
    await expectHiddenAssignmentCase(
      'Case 2 - non-enrolled student cannot see assignment',
      nonEnrolledStudent._id,
      edgeIndividualAssignment.id
    )
  );

  const submissionCountBeforeCase3 = await Submission.countDocuments({});
  const case3 = await expectErrorCase(
    'Case 3 - non-enrolled student cannot submit assignment',
    'NOT_ENROLLED',
    () =>
      submissionService.prepareSubmissionConfirmation(
        nonEnrolledStudent._id,
        edgeIndividualAssignment.id
      )
  );
  const submissionCountAfterCase3 = await Submission.countDocuments({});
  case3.details = `${case3.details} Submission count ${submissionCountBeforeCase3} -> ${submissionCountAfterCase3}.`;
  results.push(case3);

  const leaderEnrolled = edgeEnrollmentSet.has(edgeScenario.leaderId);
  const missingMemberStillUnenrolled = edgeScenario.forcedUnenrolledMemberIds.some(
    (memberId) => !edgeEnrollmentSet.has(memberId)
  );
  const assignmentCountBeforeCase4 = await Assignment.countDocuments({});
  const case4Create = await expectErrorCase(
    'Case 4 - leader enrolled but member not still rejects group assignment',
    'GROUP_MEMBERS_NOT_ENROLLED',
    () =>
      assignmentService.create(admin._id, {
        title: `Validation Probe ${edgeCourse.code} B`,
        description: 'Expected to fail even though the leader is enrolled.',
        due_date: makeDueDate(22),
        onedrive_link: 'https://onedrive.live.com/validation-case-4',
        assign_to: 'specific',
        group_ids: [normalizeId(edgeGroup._id)],
        submission_type: 'group',
        course_id: edgeScenario.courseId,
      })
  );
  const assignmentCountAfterCase4 = await Assignment.countDocuments({});
  results.push({
    case: case4Create.case,
    status:
      leaderEnrolled &&
      missingMemberStillUnenrolled &&
      case4Create.status === 'PASS' &&
      assignmentCountBeforeCase4 === assignmentCountAfterCase4
        ? 'PASS'
        : 'FAIL',
    expected: 'LEADER_ENROLLED + MEMBER_UNENROLLED + GROUP_MEMBERS_NOT_ENROLLED',
    actual: `leader_enrolled=${leaderEnrolled}; member_unenrolled=${missingMemberStillUnenrolled}; create=${case4Create.actual}`,
    details: `${case4Create.details} Assignment count ${assignmentCountBeforeCase4} -> ${assignmentCountAfterCase4}.`,
  });

  const ungroupedScenario = await findUngroupedIndividualSubmissionScenario(
    ungroupedStudents,
    assignments,
    enrollmentByCourseId
  );

  if (!ungroupedScenario) {
    throw new Error('Unable to find ungrouped student scenario for individual submission.');
  }

  const submissionCountBeforeCase5 = await Submission.countDocuments({});
  const case5 = await expectSuccessCase(
    'Case 5 - ungrouped student can submit individual assignment',
    async () => {
      const confirmation = await submissionService.prepareSubmissionConfirmation(
        ungroupedScenario.student._id,
        ungroupedScenario.assignment.id
      );
      const submission = await submissionService.confirmSubmission(
        ungroupedScenario.student._id,
        ungroupedScenario.assignment.id,
        confirmation.confirmation_token
      );

      return `Submission ${submission.id} created for ${ungroupedScenario.student.email}.`;
    }
  );
  const submissionCountAfterCase5 = await Submission.countDocuments({});
  case5.details = `${case5.details} Submission count ${submissionCountBeforeCase5} -> ${submissionCountAfterCase5}.`;
  results.push(case5);

  return results;
}

async function runGuaranteeChecks() {
  const [courses, groups, assignments, submissions, students] = await Promise.all([
    Course.find({ isDeleted: false }).lean(),
    Group.find({ isDeleted: false }).lean(),
    Assignment.find({ isDeleted: false }).lean(),
    Submission.find({})
      .populate('assignment', 'title submissionType course assignTo groupTargets')
      .populate('group', 'name members createdBy isDeleted')
      .populate('submittedBy', 'fullName email studentId')
      .lean(),
    User.find({ role: 'student', isDeleted: false }).lean(),
  ]);

  const courseEnrollmentById = new Map(
    courses.map((course) => [
      normalizeId(course._id),
      new Set((course.enrolledStudents ?? []).map(normalizeId)),
    ])
  );
  const groupsById = new Map(groups.map((group) => [normalizeId(group._id), group]));
  const assignmentsById = new Map(
    assignments.map((assignment) => [normalizeId(assignment._id), assignment])
  );
  const studentsById = new Map(students.map((student) => [normalizeId(student._id), student]));

  const invalidGroupAssignments = assignments.filter((assignment) => {
    if (assignment.submissionType !== 'group') {
      return false;
    }

    const targetGroups =
      assignment.assignTo === 'all'
        ? groups
        : (assignment.groupTargets ?? [])
            .map((groupId) => groupsById.get(normalizeId(groupId)))
            .filter(Boolean);
    const enrolledStudentIds =
      courseEnrollmentById.get(normalizeId(assignment.course)) ?? new Set();

    return targetGroups.some(
      (group) => !isGroupFullyEnrolled(group, enrolledStudentIds)
    );
  });

  const outOfCourseSubmissions = submissions.filter((submission) => {
    const assignment = submission.assignment;
    if (!assignment) {
      return true;
    }

    const enrolledStudentIds =
      courseEnrollmentById.get(normalizeId(assignment.course)) ?? new Set();

    if (assignment.submissionType === 'individual') {
      return !enrolledStudentIds.has(extractId(submission.submittedBy));
    }

    const group = submission.group;
    if (!group) {
      return true;
    }

    return (group.members ?? []).some(
      (memberId) => !enrolledStudentIds.has(normalizeId(memberId))
    );
  });

  const nonLeaderGroupSubmissions = submissions.filter((submission) => {
    const assignment = submission.assignment;
    const group = submission.group;

    if (!assignment || assignment.submissionType !== 'group' || !group) {
      return false;
    }

    return normalizeId(group.createdBy) !== extractId(submission.submittedBy);
  });

  let reflectionMismatch = null;

  for (const submission of submissions) {
    const assignment = submission.assignment;
    const group = submission.group;

    if (!assignment || assignment.submissionType !== 'group' || !group) {
      continue;
    }

    for (const memberId of group.members ?? []) {
      const visibleAssignments = await assignmentService.getForStudent(memberId);
      const memberView = visibleAssignments.find(
        (visibleAssignment) => visibleAssignment.id === normalizeId(assignment._id)
      );

      if (!memberView?.submission_status?.is_submitted) {
        const member = studentsById.get(normalizeId(memberId));
        reflectionMismatch = {
          assignmentTitle: assignment.title,
          groupName: group.name,
          memberEmail: member?.email ?? normalizeId(memberId),
        };
        break;
      }
    }

    if (reflectionMismatch) {
      break;
    }
  }

  return [
    {
      case: 'Guarantee - no invalid group assignment persists',
      status: invalidGroupAssignments.length === 0 ? 'PASS' : 'FAIL',
      expected: '0 invalid group assignments',
      actual: String(invalidGroupAssignments.length),
      details:
        invalidGroupAssignments.length === 0
          ? 'All persisted group assignments target only fully enrolled groups.'
          : invalidGroupAssignments
              .slice(0, 3)
              .map((assignment) => assignment.title)
              .join(', '),
    },
    {
      case: 'Guarantee - no submission exists outside assignment course',
      status: outOfCourseSubmissions.length === 0 ? 'PASS' : 'FAIL',
      expected: '0 out-of-course submissions',
      actual: String(outOfCourseSubmissions.length),
      details:
        outOfCourseSubmissions.length === 0
          ? 'Every submission belongs to a student/group fully enrolled in the assignment course.'
          : outOfCourseSubmissions
              .slice(0, 3)
              .map(
                (submission) =>
                  assignmentsById.get(normalizeId(submission.assignment?._id))?.title ??
                  normalizeId(submission._id)
              )
              .join(', '),
    },
    {
      case: 'Guarantee - group submissions are leader-only and reflected to all members',
      status:
        nonLeaderGroupSubmissions.length === 0 && reflectionMismatch === null
          ? 'PASS'
          : 'FAIL',
      expected: 'leader-only submissions with consistent member reflection',
      actual:
        nonLeaderGroupSubmissions.length > 0
          ? `non_leader_submissions=${nonLeaderGroupSubmissions.length}`
          : reflectionMismatch
            ? `reflection_mismatch=${reflectionMismatch.assignmentTitle}/${reflectionMismatch.memberEmail}`
            : 'consistent',
      details:
        nonLeaderGroupSubmissions.length > 0
          ? 'One or more group submissions were not created by the group leader.'
          : reflectionMismatch
            ? `Member ${reflectionMismatch.memberEmail} did not see submitted status for ${reflectionMismatch.assignmentTitle} in ${reflectionMismatch.groupName}.`
            : 'All group submissions were created by leaders and visible as submitted for every member.',
    },
  ];
}

async function writeSimulationReport({ validationResults, guaranteeResults }) {
  const [users, courses, groups, assignments, submissions] = await Promise.all([
    User.find({ isDeleted: false }).sort({ role: 1, studentId: 1, email: 1 }).lean(),
    Course.find({ isDeleted: false }).sort({ code: 1 }).lean(),
    Group.find({ isDeleted: false }).sort({ name: 1 }).lean(),
    Assignment.find({ isDeleted: false })
      .populate('course', 'code name')
      .populate('groupTargets', 'name')
      .sort({ title: 1 })
      .lean(),
    Submission.find({})
      .populate('assignment', 'title submissionType course')
      .populate('submittedBy', 'fullName email studentId')
      .populate('group', 'name members')
      .sort({ createdAt: 1 })
      .lean(),
  ]);

  const coursesById = new Map(
    courses.map((course) => [normalizeId(course._id), course])
  );
  const groupsByMemberId = new Map();
  groups.forEach((group) => {
    (group.members ?? []).forEach((memberId) => {
      groupsByMemberId.set(normalizeId(memberId), group);
    });
  });

  const enrollmentByCourseId = new Map(
    courses.map((course) => [
      normalizeId(course._id),
      new Set((course.enrolledStudents ?? []).map(normalizeId)),
    ])
  );

  const userRows = users.map((user) => {
    const userId = normalizeId(user._id);
    const group = groupsByMemberId.get(userId) ?? null;
    const enrolledCourses =
      user.role === 'student'
        ? getEnrolledCourseCodesForUser(userId, courses, enrollmentByCourseId).join(', ') || '-'
        : '-';

    return [
      user.role,
      user.fullName,
      user.email,
      user.studentId ?? '-',
      'test@123',
      group?.name ?? '-',
      enrolledCourses,
    ];
  });

  const courseRows = courses.map((course) => {
    const enrolledStudentIds = (course.enrolledStudents ?? [])
      .map((studentId) => normalizeId(studentId))
      .map((studentId) => users.find((user) => normalizeId(user._id) === studentId)?.studentId)
      .filter(Boolean)
      .sort((left, right) => left.localeCompare(right));

    return [
      course.code,
      course.name,
      course.description ?? '',
      enrolledStudentIds.length,
      enrolledStudentIds.join(', '),
    ];
  });

  const groupRows = groups.map((group) => {
    const leader = users.find(
      (user) => normalizeId(user._id) === normalizeId(group.createdBy)
    );
    const memberStudentIds = (group.members ?? [])
      .map((memberId) => normalizeId(memberId))
      .map((memberId) => users.find((user) => normalizeId(user._id) === memberId)?.studentId)
      .filter(Boolean)
      .sort((left, right) => left.localeCompare(right));

    return [
      group.name,
      leader?.email ?? '-',
      memberStudentIds.length,
      memberStudentIds.join(', '),
    ];
  });

  const assignmentRows = assignments.map((assignment) => [
    normalizeId(assignment._id),
    assignment.title,
    assignment.course?.code ?? coursesById.get(normalizeId(assignment.course))?.code ?? '-',
    assignment.submissionType,
    assignment.assignTo === 'all' ? 'all' : 'specific',
    assignment.assignTo === 'all'
      ? 'All enrolled students/groups in course'
      : (assignment.groupTargets ?? []).map((group) => group.name).join(', '),
    assignment.dueDate?.toISOString?.() ?? assignment.dueDate,
  ]);

  const submissionRows = submissions.map((submission) => {
    const assignment = submission.assignment;
    const course =
      coursesById.get(normalizeId(assignment?.course)) ??
      null;
    const reflectedTo =
      assignment?.submissionType === 'group'
        ? (submission.group?.members ?? [])
            .map((memberId) => normalizeId(memberId))
            .map((memberId) => users.find((user) => normalizeId(user._id) === memberId)?.studentId)
            .filter(Boolean)
            .sort((left, right) => left.localeCompare(right))
            .join(', ')
        : submission.submittedBy?.studentId ?? '-';

    return [
      normalizeId(submission._id),
      assignment?.title ?? '-',
      course?.code ?? '-',
      assignment?.submissionType ?? '-',
      submission.submittedBy?.email ?? '-',
      submission.group?.name ?? '-',
      reflectedTo || '-',
      submission.confirmedAt?.toISOString?.() ?? submission.confirmedAt ?? '-',
    ];
  });

  const validationRows = [...validationResults, ...guaranteeResults].map((result) => [
    result.case,
    result.status,
    result.expected,
    result.actual,
    result.details,
  ]);

  const report = [
    '# Simulation Report',
    '',
    `Generated at: ${new Date().toISOString()}`,
    '',
    '## Summary',
    '',
    `- Users: ${users.length}`,
    `- Courses: ${courses.length}`,
    `- Groups: ${groups.length}`,
    `- Assignments: ${assignments.length}`,
    `- Submissions: ${submissions.length}`,
    '',
    '## Users Table',
    '',
    markdownTable(
      ['Role', 'Name', 'Email', 'Student ID', 'Password', 'Group', 'Enrolled Courses'],
      userRows
    ),
    '',
    '## Courses Table',
    '',
    markdownTable(
      ['Code', 'Course', 'Description', 'Enrolled Count', 'Enrolled Student IDs'],
      courseRows
    ),
    '',
    '## Groups Table',
    '',
    markdownTable(
      ['Group', 'Leader Email', 'Member Count', 'Member Student IDs'],
      groupRows
    ),
    '',
    '## Assignments Table',
    '',
    markdownTable(
      ['Assignment ID', 'Title', 'Course', 'Submission Type', 'Scope', 'Targets', 'Due Date'],
      assignmentRows
    ),
    '',
    '## Submissions Table',
    '',
    markdownTable(
      ['Submission ID', 'Assignment', 'Course', 'Submission Type', 'Submitted By', 'Group', 'Reflected To', 'Confirmed At'],
      submissionRows
    ),
    '',
    '## Validation Test Results',
    '',
    markdownTable(
      ['Check', 'Status', 'Expected', 'Actual', 'Details'],
      validationRows
    ),
    '',
  ].join('\n');

  await writeFile(REPORT_PATH, report, 'utf8');
  return REPORT_PATH;
}

async function runSimulationSeed() {
  try {
    await connectDB();
    await resetData();

    const { admin, students } = await createUsers();
    const studentsById = new Map(
      students.map((student) => [normalizeId(student._id), student])
    );

    const courses = await createCourses(admin._id);
    const { groups, ungroupedStudents } = await createGroups(students);
    const enrollmentByCourseId = buildEnrollmentMap(courses, groups, ungroupedStudents);
    const edgeScenario = enforceMembershipEdgeScenario(
      courses,
      groups,
      enrollmentByCourseId
    );

    if (!edgeScenario) {
      throw new Error('Unable to construct enrollment edge scenario.');
    }

    await persistCourseEnrollments(courses, enrollmentByCourseId);

    const assignments = await createAssignments(
      admin._id,
      courses,
      groups,
      enrollmentByCourseId
    );
    const submissions = await createRandomSubmissions(
      assignments,
      groups,
      studentsById,
      enrollmentByCourseId
    );

    const validationResults = await runValidationChecks({
      admin,
      assignments,
      courses,
      edgeScenario,
      enrollmentByCourseId,
      groups,
      studentsById,
      ungroupedStudents,
    });
    const guaranteeResults = await runGuaranteeChecks();
    const reportPath = await writeSimulationReport({
      validationResults,
      guaranteeResults,
    });

    // eslint-disable-next-line no-console
    console.log('Simulation seed complete');
    // eslint-disable-next-line no-console
    console.log('Admin: admin@groupd.com / test@123');
    // eslint-disable-next-line no-console
    console.log(`Students: s1@groupd.com .. s${STUDENT_COUNT}@groupd.com / test@123`);
    // eslint-disable-next-line no-console
    console.log(
      `Created ${courses.length} courses, ${groups.length} groups, ${assignments.length} assignments, ${submissions.length} submissions before validation probes`
    );
    // eslint-disable-next-line no-console
    console.log(`Ungrouped students: ${ungroupedStudents.length}`);
    // eslint-disable-next-line no-console
    console.log(`Report written to: ${reportPath}`);
    // eslint-disable-next-line no-console
    console.log('Validation results:');
    [...validationResults, ...guaranteeResults].forEach((result) => {
      // eslint-disable-next-line no-console
      console.log(`- [${result.status}] ${result.case} (expected=${result.expected}, actual=${result.actual})`);
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Simulation seed failed:', error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

runSimulationSeed();
