import Card from './Card';
import Button from './Button';

export default function EmptyState({
  icon: Icon,
  title,
  message,
  actionLabel,
  onAction,
}) {
  return (
    <div className="empty-state">
      <Card className="empty-state__card">
        {Icon ? (
          <div className="empty-state__icon">
            <Icon size={32} />
          </div>
        ) : null}
        <h2 className="empty-state__title">{title}</h2>
        <p className="empty-state__message">{message}</p>
        {actionLabel && onAction ? (
          <Button type="button" onClick={onAction}>
            {actionLabel}
          </Button>
        ) : null}
      </Card>
    </div>
  );
}
