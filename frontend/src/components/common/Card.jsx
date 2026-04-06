import { cx } from '../../utils/cx';

function cardClassName({
  variant = 'default',
  interactive = false,
  className = '',
} = {}) {
  return cx(
    'card',
    variant === 'accent' && 'card--accent',
    variant === 'compact' && 'card--compact',
    interactive && 'card--interactive',
    className
  );
}

export default function Card({
  as = 'section',
  variant = 'default',
  interactive = false,
  accent,
  className = '',
  style,
  children,
  ...props
}) {
  const Component = as;

  return (
    <Component
      className={cardClassName({ variant, interactive, className })}
      style={{
        ...(accent ? { '--card-accent': accent } : null),
        ...style,
      }}
      {...props}
    >
      {children}
    </Component>
  );
}
