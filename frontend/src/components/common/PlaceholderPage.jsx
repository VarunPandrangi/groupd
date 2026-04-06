export default function PlaceholderPage({ name }) {
  return (
    <div
      className="min-h-screen flex items-center justify-center text-3xl font-semibold tracking-tight"
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-page)',
        color: 'var(--text-primary)',
        fontFamily: 'var(--font-sans)',
        fontSize: '2.5rem',
        fontWeight: 600,
        letterSpacing: '-0.02em',
      }}
    >
      {name}
    </div>
  );
}
