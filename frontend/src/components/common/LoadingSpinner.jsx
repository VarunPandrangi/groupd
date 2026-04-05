export default function LoadingSpinner({ fullPage = true, size = 40 }) {
  const spinner = (
    <div
      style={{
        width: size,
        height: size,
        border: `3px solid var(--border-default)`,
        borderTopColor: 'var(--accent-primary)',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }}
    />
  );

  if (!fullPage) return spinner;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-primary)',
        zIndex: 100,
      }}
    >
      {spinner}
    </div>
  );
}
