import AnimatedCounter from '../common/AnimatedCounter';

export default function SummaryCard({ title, value, icon: Icon, color }) {
  const isPercentage = title === 'Completion Rate';

  return (
    <article
      style={{
        position: 'relative',
        overflow: 'hidden',
        padding: '24px',
        borderRadius: '24px',
        border: '1px solid var(--border-default)',
        background:
          `radial-gradient(circle at top right, color-mix(in srgb, ${color} 14%, transparent), transparent 42%), var(--bg-secondary)`,
        boxShadow: '0 16px 40px rgba(0, 0, 0, 0.12)',
        transition: 'transform 180ms ease, border-color 180ms ease, box-shadow 180ms ease',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '3px',
          background: `linear-gradient(90deg, ${color}, transparent 78%)`,
        }}
      />

      <div
        style={{
          width: '48px',
          height: '48px',
          borderRadius: '16px',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: `color-mix(in srgb, ${color} 14%, transparent)`,
          color,
          opacity: 0.95,
        }}
      >
        {Icon ? <Icon size={22} strokeWidth={2.1} /> : null}
      </div>

      <div
        style={{
          marginTop: '28px',
          display: 'flex',
          alignItems: 'baseline',
          gap: '4px',
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(2rem, 4vw, 2.8rem)',
          lineHeight: 1,
          letterSpacing: '-0.05em',
          color: 'var(--text-primary)',
        }}
      >
        <AnimatedCounter target={value} />
        {isPercentage ? <span>%</span> : null}
      </div>

      <p
        style={{
          margin: '14px 0 0',
          fontSize: '0.88rem',
          fontWeight: 600,
          letterSpacing: '0.03em',
          color: 'var(--text-secondary)',
        }}
      >
        {title}
      </p>
    </article>
  );
}
