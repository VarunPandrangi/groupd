import { SpinnerGap } from '@phosphor-icons/react';

export default function LoadingSpinner({ fullPage = true, size = 40 }) {
  const spinner = (
    <span className="inline-flex items-center justify-center spinner" aria-hidden="true">
      <SpinnerGap size={size} />
    </span>
  );

  if (!fullPage) {
    return spinner;
  }

  return <div className="min-h-screen flex items-center justify-center loading-screen">{spinner}</div>;
}
