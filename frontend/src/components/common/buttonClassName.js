import { cx } from '../../utils/cx';

export function buttonClassName({
  variant = 'primary',
  size = 'md',
  iconOnly = false,
  className = '',
} = {}) {
  return cx(
    'btn',
    `btn--${variant}`,
    size === 'sm' && 'btn--sm',
    iconOnly && 'btn--icon',
    className
  );
}
