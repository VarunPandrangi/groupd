const STATUS_STYLES = {
  upcoming: {
    label: 'Upcoming',
    background: 'var(--accent-blue-soft)',
    color: 'var(--accent-blue)',
  },
  active: {
    label: 'Active',
    background: 'var(--accent-amber-soft)',
    color: 'var(--accent-amber)',
  },
  overdue: {
    label: 'Overdue',
    background: 'var(--accent-red-soft)',
    color: 'var(--accent-red)',
  },
  confirmed: {
    label: 'Submitted',
    background: 'var(--accent-green-soft)',
    color: 'var(--accent-green)',
  },
  submitted: {
    label: 'Submitted',
    background: 'var(--accent-green-soft)',
    color: 'var(--accent-green)',
  },
  complete: {
    label: 'Complete',
    background: 'var(--accent-green-soft)',
    color: 'var(--accent-green)',
  },
  pending: {
    label: 'Pending',
    background: 'var(--bg-hover)',
    color: 'var(--text-muted)',
  },
};

export default function StatusBadge({ status = 'pending', label }) {
  const normalizedStatus = String(status).trim().toLowerCase();
  const style = STATUS_STYLES[normalizedStatus] ?? STATUS_STYLES.pending;

  return (
    <span
      className="inline-flex items-center justify-center rounded-md text-xs font-medium status-badge"
      style={{
        background: style.background,
        color: style.color,
      }}
    >
      {label ?? style.label}
    </span>
  );
}
