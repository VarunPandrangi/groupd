const VARIANT_STYLES = {
  text: {
    width: '100%',
    height: '0.95rem',
    borderRadius: '999px',
  },
  card: {
    width: '100%',
    height: '180px',
    borderRadius: '24px',
  },
  circle: {
    width: '48px',
    height: '48px',
    borderRadius: '999px',
  },
  chart: {
    width: '100%',
    height: '320px',
    borderRadius: '24px',
  },
};

export default function Skeleton({
  variant = 'text',
  width,
  height,
  style = {},
}) {
  const variantStyle = VARIANT_STYLES[variant] ?? VARIANT_STYLES.text;

  return (
    <>
      <style>{`
        @keyframes dashboardSkeletonPulse {
          0% { opacity: 0.55; }
          50% { opacity: 1; }
          100% { opacity: 0.55; }
        }
      `}</style>

      <div
        aria-hidden="true"
        style={{
          width: width ?? variantStyle.width,
          height: height ?? variantStyle.height,
          borderRadius: variantStyle.borderRadius,
          background:
            'linear-gradient(90deg, color-mix(in srgb, var(--bg-tertiary) 85%, transparent), color-mix(in srgb, var(--text-tertiary) 10%, transparent), color-mix(in srgb, var(--bg-tertiary) 85%, transparent))',
          animation: 'dashboardSkeletonPulse 1.4s ease-in-out infinite',
          ...style,
        }}
      />
    </>
  );
}
