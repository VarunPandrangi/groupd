import { useEffect, useRef, useState } from 'react';

function easeOutCubic(progress) {
  return 1 - (1 - progress) ** 3;
}

function normalizeTarget(target) {
  const numericTarget = Number(target);

  if (!Number.isFinite(numericTarget)) {
    return 0;
  }

  return Math.max(0, Math.round(numericTarget));
}

export default function AnimatedCounter({ target = 0, duration = 1000 }) {
  const [count, setCount] = useState(0);
  const frameRef = useRef(null);

  useEffect(() => {
    const safeTarget = normalizeTarget(target);
    const safeDuration = Math.max(1, Number(duration) || 1000);
    let startTime = null;

    const updateCount = (timestamp) => {
      if (startTime === null) {
        startTime = timestamp;
      }

      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / safeDuration, 1);
      const easedProgress = easeOutCubic(progress);
      const nextCount = Math.round(safeTarget * easedProgress);

      setCount(nextCount);

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(updateCount);
        return;
      }

      setCount(safeTarget);
    };

    frameRef.current = requestAnimationFrame(updateCount);

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [duration, target]);

  return <span>{count.toLocaleString()}</span>;
}
