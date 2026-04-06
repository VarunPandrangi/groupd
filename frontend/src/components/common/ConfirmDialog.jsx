import Button from './Button';
import Modal from './Modal';

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  variant = 'default',
}) {
  return (
    <Modal
      open={isOpen}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          onCancel?.();
        }
      }}
      title={title}
      description={message}
      footer={
        <div className="inline-flex items-center gap-3">
          <Button type="button" variant="secondary" onClick={onCancel}>
            {cancelText}
          </Button>
          <Button
            type="button"
            variant={variant === 'danger' ? 'danger' : 'primary'}
            onClick={onConfirm}
          >
            {confirmText}
          </Button>
        </div>
      }
    />
  );
}
