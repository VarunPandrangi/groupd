import AnimatedCounter from '../common/AnimatedCounter';
import Card from '../common/Card';

const SOFT_COLOR_MAP = {
  'var(--accent-blue)': 'var(--accent-blue-soft)',
  'var(--accent-amber)': 'var(--accent-amber-soft)',
  'var(--accent-green)': 'var(--accent-green-soft)',
  'var(--accent-red)': 'var(--accent-red-soft)',
};

export default function SummaryCard({ title, value, icon: Icon, color }) {
  const isPercentage = title === 'Completion Rate';
  const softColor = SOFT_COLOR_MAP[color] ?? 'var(--bg-hover)';

  return (
    <Card variant="accent" accent={color}>
      <div className="metric">
        <div
          className="metric__icon"
          style={{ background: softColor, color }}
        >
          {Icon ? <Icon size={20} /> : null}
        </div>
        <div>
          <div className="metric__value">
            <AnimatedCounter target={value} />
            {isPercentage ? '%' : null}
          </div>
          <p className="metric__label">{title}</p>
        </div>
      </div>
    </Card>
  );
}
