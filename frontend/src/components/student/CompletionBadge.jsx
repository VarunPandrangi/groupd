import { CheckCircle, Clock, Circle } from 'lucide-react';

const STATUS_CONFIG = {
  complete: {
    label: 'Complete',
    color: 'var(--accent-secondary)',
    background: 'color-mix(in srgb, var(--accent-secondary) 14%, transparent)',
    borderColor: 'color-mix(in srgb, var(--accent-secondary) 26%, transparent)',
    Icon: CheckCircle,
  },
  'in-progress': {
    label: 'In Progress',
    color: 'var(--accent-warning)',
    background: 'color-mix(in srgb, var(--accent-warning) 14%, transparent)',
    borderColor: 'color-mix(in srgb, var(--accent-warning) 26%, transparent)',
    Icon: Clock,
  },
  'not-started': {
    label: 'Not Started',
    color: 'var(--text-tertiary)',
    background: 'color-mix(in srgb, var(--text-tertiary) 12%, transparent)',
    borderColor: 'color-mix(in srgb, var(--text-tertiary) 22%, transparent)',
    Icon: Circle,
  },
  pending: {
    label: 'Pending',
    color: 'var(--text-tertiary)',
    background: 'color-mix(in srgb, var(--text-tertiary) 12%, transparent)',
    borderColor: 'color-mix(in srgb, var(--text-tertiary) 22%, transparent)',
    Icon: Circle,
  },
};

export default function CompletionBadge({ status = 'not-started' }) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG['not-started'];
  const { Icon } = config;

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '6px 12px',
        borderRadius: '999px',
        border: `1px solid ${config.borderColor}`,
        background: config.background,
        color: config.color,
        fontSize: '0.74rem',
        fontWeight: 700,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        whiteSpace: 'nowrap',
        lineHeight: 1,
      }}
    >
      <Icon size={14} />
      {config.label}
    </span>
  );
}
