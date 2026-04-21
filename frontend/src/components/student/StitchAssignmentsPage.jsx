import {
  ArrowRight,
  CalendarDots,
  UploadSimple,
} from '@phosphor-icons/react';
import { formatAssignmentDate } from '../../utils/assignmentDates';

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

function toStartOfDay(dateValue) {
  const date = new Date(dateValue);
  date.setHours(0, 0, 0, 0);
  return date;
}

function getDueDeltaLabel(dueDate, status) {
  if (!dueDate) {
    return status === 'overdue' ? '-1 DAY' : 'NO DUE DATE';
  }

  const now = toStartOfDay(new Date());
  const due = toStartOfDay(dueDate);
  const dayDelta = Math.round((due.getTime() - now.getTime()) / ONE_DAY_MS);

  if (status === 'overdue' || dayDelta < 0) {
    const absoluteDays = Math.max(1, Math.abs(dayDelta));
    return `-${absoluteDays} DAY${absoluteDays === 1 ? '' : 'S'}`;
  }

  if (dayDelta === 0) {
    return 'DUE TODAY';
  }

  if (dayDelta === 1) {
    return 'DUE TOMORROW';
  }

  return `DUE IN ${dayDelta} DAYS`;
}

function getCourseLabel(assignment) {
  if (assignment?.course_code) {
    return String(assignment.course_code).toUpperCase();
  }

  if (assignment?.course_name) {
    return String(assignment.course_name).toUpperCase();
  }

  return 'GROUP ASSIGNMENT';
}

function LaneCard({ assignment, lane, onOpen }) {
  const isCritical = lane === 'critical';
  const isUpcoming = lane === 'upcoming';

  return (
    <article
      className={`stitch-assignments__lane-card${isCritical ? ' stitch-assignments__lane-card--critical' : ''}`}
    >
      <header className="stitch-assignments__lane-card-top">
        <span
          className={`stitch-assignments__lane-chip${isCritical ? ' stitch-assignments__lane-chip--critical' : ''}`}
        >
          {isCritical ? 'OVERDUE' : isUpcoming ? 'PENDING' : 'IN PROGRESS'}
        </span>
        <span className="stitch-assignments__lane-delta">{getDueDeltaLabel(assignment?.due_date, assignment?.status)}</span>
      </header>

      <div className="stitch-assignments__lane-card-body">
        <p className="stitch-assignments__lane-course">{getCourseLabel(assignment)}</p>
        <h3 className="stitch-assignments__lane-title">{assignment?.title || 'Untitled assignment'}</h3>
        <p className="stitch-assignments__lane-description">
          {assignment?.description || 'No description provided for this assignment.'}
        </p>
      </div>

      <footer className="stitch-assignments__lane-card-footer">
        <div className="stitch-assignments__lane-due-row">
          <CalendarDots size={14} />
          <span>{assignment?.due_date ? formatAssignmentDate(assignment.due_date) : 'No due date'}</span>
        </div>

        <button
          type="button"
          className={`stitch-assignments__lane-action${isCritical ? ' stitch-assignments__lane-action--critical' : ''}`}
          onClick={() => onOpen(assignment?.id)}
        >
          <UploadSimple size={13} weight="bold" />
          {isCritical ? 'UPLOAD LATE' : isUpcoming ? 'REVIEW BRIEF' : 'UPLOAD WORK'}
        </button>
      </footer>
    </article>
  );
}

function Lane({ title, laneKey, assignments, onOpen }) {
  return (
    <section className="stitch-assignments__lane">
      <header className="stitch-assignments__lane-header">
        <h2>{title}</h2>
      </header>

      <div className="stitch-assignments__lane-stack">
        {assignments.length === 0 ? (
          <article className="stitch-assignments__lane-empty">
            <p>No assignments in this lane yet.</p>
          </article>
        ) : (
          assignments.map((assignment) => (
            <LaneCard
              key={assignment.id}
              assignment={assignment}
              lane={laneKey}
              onOpen={onOpen}
            />
          ))
        )}
      </div>
    </section>
  );
}

function DependencyIcon() {
  return (
    <svg
      aria-hidden="true"
      className="stitch-assignments__prereq-rail-icon"
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle cx="6" cy="19" r="2.1" stroke="currentColor" strokeWidth="1.9" />
      <circle cx="12" cy="11" r="2.1" stroke="currentColor" strokeWidth="1.9" />
      <circle cx="18" cy="5" r="2.1" stroke="currentColor" strokeWidth="1.9" />
      <path d="M8 17.5v-8.3a3.95 3.95 0 0 1 1.15-2.8L10.3 5.2" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
      <path d="M14 9.7v-1A3.7 3.7 0 0 1 17.7 5" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
    </svg>
  );
}

function DependencyAlertIcon() {
  return (
    <svg
      aria-hidden="true"
      className="stitch-assignments__prereq-alert-icon"
      viewBox="0 0 24 24"
      fill="none"
    >
      <path d="M12 3.4 21 20H3L12 3.4Z" fill="#c70713" />
      <path d="M12 8.2v5.5" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
      <circle cx="12" cy="16.9" r="1.1" fill="#fff" />
    </svg>
  );
}

function AssignmentEmptyIcon() {
  return (
    <svg
      aria-hidden="true"
      className="stitch-assignments__matrix-clipboard-icon"
      viewBox="0 0 64 64"
      fill="none"
    >
      <path
        d="M22 17h20a4 4 0 0 1 4 4v22a4 4 0 0 1-4 4H22a4 4 0 0 1-4-4V21a4 4 0 0 1 4-4Z"
        fill="#090b11"
      />
      <path
        d="M26 13h12a3 3 0 0 1 3 3v2H23v-2a3 3 0 0 1 3-3Z"
        fill="#090b11"
      />
      <circle cx="32" cy="15" r="2.8" fill="#f6f4f1" />
      <path d="M24.5 25.5h15" stroke="#f6f4f1" strokeWidth="3.2" strokeLinecap="round" />
      <path d="M24.5 32.5h11" stroke="#f6f4f1" strokeWidth="3.2" strokeLinecap="round" />
      <path d="M24.5 39.5h9" stroke="#f6f4f1" strokeWidth="3.2" strokeLinecap="round" />
      <circle cx="43.5" cy="40.5" r="8.5" fill="#090b11" />
      <path d="M43.5 36.5v8" stroke="#f6f4f1" strokeWidth="3" strokeLinecap="round" />
      <path d="M39.5 40.5h8" stroke="#f6f4f1" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

function NoGroupPanel({ onFindGroup }) {
  return (
    <div className="stitch-assignments__no-group">
      <section className="stitch-assignments__hero">
        <h2>
          KEEP EVERY DEADLINE
          <span>IN SHARP FOCUS</span>
        </h2>
      </section>

      <section className="stitch-assignments__prereq">
        <div className="stitch-assignments__prereq-icon">
          <DependencyIcon />
        </div>

        <div className="stitch-assignments__prereq-copy">
          <p className="stitch-assignments__prereq-title">
            <DependencyAlertIcon />
            <span>PREREQUISITE DEPENDENCY</span>
          </p>
          <p>
            Assignment module access is locked. Group membership is required to view, manage, and submit shared
            deliverables. Proceed to the group directory to initiate formation.
          </p>
        </div>

        <button type="button" className="stitch-assignments__prereq-action" onClick={onFindGroup}>
          FIND A GROUP
          <ArrowRight size={12} weight="bold" />
        </button>
      </section>

      <section className="stitch-assignments__matrix" aria-label="Assignments matrix is empty">
        <div className="stitch-assignments__matrix-grid" aria-hidden="true" />

        <div className="stitch-assignments__matrix-card">
          <div className="stitch-assignments__matrix-icon">
            <AssignmentEmptyIcon />
          </div>
          <h3>NO ASSIGNMENTS HERE YET</h3>
          <span className="stitch-assignments__matrix-divider" aria-hidden="true" />
          <p>
            The assignment matrix is currently empty for your profile. Awaiting group designation before
            populating technical requirements and deadlines.
          </p>
        </div>

        <span className="stitch-assignments__matrix-label stitch-assignments__matrix-label--top">SYS_STAT: EMPTY</span>
        <span className="stitch-assignments__matrix-label stitch-assignments__matrix-label--bottom">MATRIX_NUL</span>
      </section>
    </div>
  );
}

function ActivePanel({ assignments, onOpenAssignment }) {
  const normalizedAssignments = assignments.filter(
    (assignment) =>
      assignment &&
      (assignment.id || assignment.title || assignment.description || assignment.due_date)
  );
  const overdueAssignments = normalizedAssignments.filter((assignment) => assignment.status === 'overdue');
  const activeAssignments = normalizedAssignments.filter((assignment) => assignment.status === 'active');
  const upcomingAssignments = normalizedAssignments.filter((assignment) => assignment.status === 'upcoming');

  const totalPending = overdueAssignments.length + activeAssignments.length + upcomingAssignments.length;

  return (
    <div className="stitch-assignments__active">
      <section className="stitch-assignments__workload-head">
        <div>
          <p className="stitch-assignments__workload-label">WORK MATRIX</p>
          <h2>Active Workload</h2>
        </div>

        <div className="stitch-assignments__pending">
          <span>TOTAL PENDING</span>
          <strong>{String(totalPending).padStart(2, '0')}</strong>
        </div>
      </section>

      <section className="stitch-assignments__lanes">
        <Lane
          title="Critical / Overdue"
          laneKey="critical"
          assignments={overdueAssignments}
          onOpen={onOpenAssignment}
        />

        <Lane
          title="Active Workspace"
          laneKey="active"
          assignments={activeAssignments}
          onOpen={onOpenAssignment}
        />

        <Lane
          title="Upcoming Pipeline"
          laneKey="upcoming"
          assignments={upcomingAssignments}
          onOpen={onOpenAssignment}
        />
      </section>
    </div>
  );
}

export default function StitchAssignmentsPage({
  hasGroup,
  assignments,
  onFindGroup,
  onOpenAssignment,
}) {
  return (
    <div
      className={`stitch-assignments__content${hasGroup ? ' stitch-assignments__content--active-grid' : ''}`}
      aria-label="Stitch assignments workspace"
    >
      {hasGroup ? (
        <ActivePanel assignments={assignments} onOpenAssignment={onOpenAssignment} />
      ) : (
        <NoGroupPanel onFindGroup={onFindGroup} />
      )}
    </div>
  );
}
