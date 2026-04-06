import { SpinnerGap } from '@phosphor-icons/react';

export default function LoadingSpinner({ fullPage = true, size = 40 }) {
  const spinner = (
    <span className="spinner" aria-hidden="true">
      <SpinnerGap size={size} />
    </span>
  );

  if (!fullPage) {
    return spinner;
  }

  return <div className="loading-screen">{spinner}</div>;
}
