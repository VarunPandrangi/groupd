export default function PlaceholderPage({ name }) {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-primary)',
        color: 'var(--text-primary)',
        fontFamily: 'var(--font-display)',
        fontSize: '2.5rem',
        fontWeight: 600,
        letterSpacing: '-0.02em',
      }}
    >
      {name}
    </div>
  );
}
