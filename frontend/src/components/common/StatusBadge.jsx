const STATUS_STYLES = {
  upcoming: {
    color: 'var(--accent-primary)',
    background: 'color-mix(in srgb, var(--accent-primary) 20%, transparent)',
    borderColor: 'color-mix(in srgb, var(--accent-primary) 28%, transparent)',
  },
  active: {
    color: 'var(--accent-warning)',
    background: 'color-mix(in srgb, var(--accent-warning) 20%, transparent)',
    borderColor: 'color-mix(in srgb, var(--accent-warning) 28%, transparent)',
  },
  overdue: {
    color: 'var(--accent-danger)',
    background: 'color-mix(in srgb, var(--accent-danger) 20%, transparent)',
    borderColor: 'color-mix(in srgb, var(--accent-danger) 28%, transparent)',
  },
  confirmed: {
    color: 'var(--accent-secondary)',
    background: 'color-mix(in srgb, var(--accent-secondary) 20%, transparent)',
    borderColor: 'color-mix(in srgb, var(--accent-secondary) 28%, transparent)',
  },
  pending: {
    color: 'var(--text-tertiary)',
    background: 'color-mix(in srgb, var(--text-tertiary) 16%, transparent)',
    borderColor: 'color-mix(in srgb, var(--text-tertiary) 24%, transparent)',
  },
};

export default function StatusBadge({ status = 'pending' }) {
  const normalizedStatus = String(status).trim().toLowerCase();
  const style = STATUS_STYLES[normalizedStatus] ?? STATUS_STYLES.pending;

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '7px 12px',
        borderRadius: '999px',
        border: `1px solid ${style.borderColor}`,
        background: style.background,
        color: style.color,
        fontSize: '0.72rem',
        fontWeight: 800,
        letterSpacing: '0.09em',
        textTransform: 'uppercase',
        lineHeight: 1,
        whiteSpace: 'nowrap',
      }}
    >
      {normalizedStatus.replace(/_/g, ' ')}
    </span>
  );
}
