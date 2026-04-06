import { useEffect, useId, useState } from 'react';

const SIZE_MAP = {
  sm: { height: 6, borderRadius: 3, fontSize: '0.72rem' },
  md: { height: 10, borderRadius: 5, fontSize: '0.82rem' },
  lg: { height: 16, borderRadius: 8, fontSize: '0.92rem' },
};

export default function ProgressBar({
  current = 0,
  total = 1,
  showLabel = false,
  size = 'md',
}) {
  const id = useId();
  const [animatedWidth, setAnimatedWidth] = useState(0);
  const percentage = total > 0 ? Math.round((current / total) * 100) : 0;
  const sizeStyle = SIZE_MAP[size] ?? SIZE_MAP.md;

  useEffect(() => {
    // Trigger animated width on mount
    const rafId = requestAnimationFrame(() => {
      setAnimatedWidth(percentage);
    });
    return () => cancelAnimationFrame(rafId);
  }, [percentage]);

  let fillColor = 'var(--text-tertiary)';
  if (percentage === 100) {
    fillColor = 'var(--accent-secondary)';
  } else if (percentage > 0) {
    fillColor = 'var(--accent-warning)';
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%' }}>
      <div
        role="progressbar"
        aria-valuenow={current}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-label={`${current} of ${total}`}
        style={{
          flex: 1,
          height: sizeStyle.height,
          borderRadius: sizeStyle.borderRadius,
          background: 'color-mix(in srgb, var(--text-tertiary) 18%, transparent)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${animatedWidth}%`,
            height: '100%',
            borderRadius: sizeStyle.borderRadius,
            background: fillColor,
            transition: 'width 800ms ease-out',
            boxShadow:
              percentage === 100
                ? '0 0 12px rgba(52, 211, 153, 0.35)'
                : percentage > 0
                  ? '0 0 12px rgba(251, 191, 36, 0.25)'
                  : 'none',
          }}
        />
      </div>

      {showLabel && (
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: sizeStyle.fontSize,
            fontWeight: 600,
            color: 'var(--text-secondary)',
            whiteSpace: 'nowrap',
            minWidth: '42px',
            textAlign: 'right',
          }}
        >
          {current}/{total}
        </span>
      )}
    </div>
  );
}
