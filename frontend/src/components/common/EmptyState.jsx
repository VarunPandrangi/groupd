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
    <div className="min-h-screen flex items-center justify-center empty-state">
      <Card className="grid gap-3 max-w-lg empty-state__card">
        {Icon ? (
          <div className="inline-flex items-center justify-center rounded-2xl empty-state__icon">
            <Icon size={32} />
          </div>
        ) : null}
        <h2 className="text-3xl font-bold tracking-tight empty-state__title">{title}</h2>
        <p className="text-base leading-relaxed empty-state__message">{message}</p>
        {actionLabel && onAction ? (
          <Button type="button" onClick={onAction}>
            {actionLabel}
          </Button>
        ) : null}
      </Card>
    </div>
  );
}
