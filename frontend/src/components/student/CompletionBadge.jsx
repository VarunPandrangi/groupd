import { CheckCircle, Circle, ClockCountdown } from '@phosphor-icons/react';

const STATUS_CONFIG = {
  complete: {
    label: 'Complete',
    color: 'var(--accent-green)',
    background: 'var(--accent-green-soft)',
    Icon: CheckCircle,
  },
  'in-progress': {
    label: 'In Progress',
    color: 'var(--accent-amber)',
    background: 'var(--accent-amber-soft)',
    Icon: ClockCountdown,
  },
  'not-started': {
    label: 'Not Started',
    color: 'var(--text-muted)',
    background: 'var(--bg-hover)',
    Icon: Circle,
  },
  pending: {
    label: 'Pending',
    color: 'var(--text-muted)',
    background: 'var(--bg-hover)',
    Icon: Circle,
  },
};

export default function CompletionBadge({ status = 'not-started' }) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG['not-started'];
  const Icon = config.Icon;

  return (
    <span
      className="status-badge"
      style={{
        background: config.background,
        color: config.color,
        display: 'inline-flex',
        gap: '6px',
      }}
    >
      <Icon size={14} weight="fill" />
      {config.label}
    </span>
  );
}
