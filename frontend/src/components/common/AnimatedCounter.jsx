import { animate, useMotionValue, useMotionValueEvent, useTransform } from 'framer-motion';
import { useEffect, useState } from 'react';

function normalizeTarget(target) {
  const numericTarget = Number(target);

  if (!Number.isFinite(numericTarget)) {
    return 0;
  }

  return Math.max(0, numericTarget);
}

export default function AnimatedCounter({ target = 0, duration = 1000 }) {
  const safeTarget = normalizeTarget(target);
  const motionValue = useMotionValue(0);
  const roundedValue = useTransform(motionValue, (latest) => Math.round(latest));
  const [displayValue, setDisplayValue] = useState(0);

  useMotionValueEvent(roundedValue, 'change', (latest) => {
    setDisplayValue(latest);
  });

  useEffect(() => {
    motionValue.set(0);
    const controls = animate(motionValue, safeTarget, {
      duration: Math.max(0.2, duration / 1000),
      ease: 'easeOut',
    });

    return () => controls.stop();
  }, [duration, motionValue, safeTarget]);

  return <span>{displayValue.toLocaleString()}</span>;
}
