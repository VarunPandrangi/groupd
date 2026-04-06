import { cx } from '../../utils/cx';

export default function LogoWordmark({ className = '' }) {
  return (
    <span className={cx('brand__wordmark', className)}>
      <span>group</span>
      <span className="brand__accent">d</span>
    </span>
  );
}
