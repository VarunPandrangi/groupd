import { Link } from 'react-router-dom';
import { buttonClassName } from './buttonClassName';

export default function Button({
  to,
  variant = 'primary',
  size = 'md',
  iconOnly = false,
  className = '',
  children,
  ...props
}) {
  const classes = buttonClassName({ variant, size, iconOnly, className });

  if (to) {
    return (
      <Link to={to} className={`inline-flex items-center justify-center ${classes}`} {...props}>
        {children}
      </Link>
    );
  }

  return (
    <button className={`inline-flex items-center justify-center ${classes}`} {...props}>
      {children}
    </button>
  );
}
