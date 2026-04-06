const VARIANT_STYLES = {
  text: {
    width: '100%',
    height: '0.95rem',
    borderRadius: '999px',
  },
  card: {
    width: '100%',
    height: '180px',
    borderRadius: '12px',
  },
  circle: {
    width: '48px',
    height: '48px',
    borderRadius: '999px',
  },
  chart: {
    width: '100%',
    height: '320px',
    borderRadius: '12px',
  },
};

export default function Skeleton({
  variant = 'text',
  width,
  height,
  style = {},
}) {
  const variantStyle = VARIANT_STYLES[variant] ?? VARIANT_STYLES.text;

  return (
    <div
      aria-hidden="true"
      className="overflow-hidden rounded-lg skeleton"
      style={{
        width: width ?? variantStyle.width,
        height: height ?? variantStyle.height,
        borderRadius: variantStyle.borderRadius,
        ...style,
      }}
    />
  );
}
