import { motion as Motion } from 'framer-motion';

const SIZE_MAP = {
  sm: { height: 6, fontSize: '12px' },
  md: { height: 8, fontSize: '12px' },
  lg: { height: 10, fontSize: '13px' },
};

export default function ProgressBar({
  current = 0,
  total = 1,
  showLabel = false,
  size = 'md',
  tone = 'auto',
}) {
  const percentage = total > 0 ? Math.round((current / total) * 100) : 0;
  const sizeStyle = SIZE_MAP[size] ?? SIZE_MAP.md;

  let fill = 'var(--accent-blue)';
  if (tone === 'success' || (tone === 'auto' && percentage === 100)) {
    fill = 'var(--accent-green)';
  } else if (tone === 'warning' || (tone === 'auto' && percentage > 0 && percentage < 100)) {
    fill = 'var(--accent-amber)';
  }

  return (
    <div style={{ display: 'grid', gap: '8px', width: '100%' }}>
      <div
        role="progressbar"
        aria-valuenow={current}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-label={`${current} of ${total}`}
        style={{
          overflow: 'hidden',
          height: sizeStyle.height,
          borderRadius: 999,
          background: 'var(--bg-hover)',
        }}
      >
        <Motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ type: 'spring', stiffness: 280, damping: 28 }}
          style={{
            height: '100%',
            borderRadius: 999,
            background: fill,
          }}
        />
      </div>

      {showLabel ? (
        <span
          className="text-sm mono"
          style={{
            fontSize: sizeStyle.fontSize,
            textAlign: 'right',
            color: 'var(--text-muted)',
          }}
        >
          {current}/{total}
        </span>
      ) : null}
    </div>
  );
}
