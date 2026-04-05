export default function EmptyState({
  icon: Icon,
  title,
  message,
  actionLabel,
  onAction,
}) {
  return (
    <div
      style={{
        minHeight: '60vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '520px',
          textAlign: 'center',
          padding: '40px 32px',
          borderRadius: '28px',
          border: '1px solid var(--border-default)',
          background:
            'radial-gradient(circle at top, rgba(79, 123, 247, 0.12), transparent 42%), var(--bg-secondary)',
          boxShadow: '0 26px 60px rgba(0, 0, 0, 0.16)',
        }}
      >
        {Icon ? (
          <div
            style={{
              width: '84px',
              height: '84px',
              borderRadius: '24px',
              margin: '0 auto 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(100, 116, 139, 0.08)',
              color: 'var(--text-tertiary)',
            }}
          >
            <Icon size={40} strokeWidth={1.8} />
          </div>
        ) : null}

        <h2
          style={{
            margin: 0,
            fontFamily: 'var(--font-display)',
            fontSize: '2rem',
            letterSpacing: '-0.03em',
            color: 'var(--text-primary)',
          }}
        >
          {title}
        </h2>

        <p
          style={{
            margin: '12px auto 0',
            maxWidth: '400px',
            fontSize: '0.98rem',
            lineHeight: 1.75,
            color: 'var(--text-secondary)',
          }}
        >
          {message}
        </p>

        {actionLabel && onAction ? (
          <button
            type="button"
            onClick={onAction}
            style={{
              marginTop: '26px',
              padding: '13px 22px',
              border: 'none',
              borderRadius: '14px',
              background: 'var(--accent-primary)',
              color: '#ffffff',
              fontFamily: 'var(--font-body)',
              fontSize: '0.95rem',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 18px 40px rgba(79, 123, 247, 0.24)',
            }}
          >
            {actionLabel}
          </button>
        ) : null}
      </div>
    </div>
  );
}
