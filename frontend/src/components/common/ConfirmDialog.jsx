import { useEffect, useId } from 'react';
import { createPortal } from 'react-dom';

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
  const titleId = useId();

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onCancel?.();
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onCancel]);

  if (!isOpen) {
    return null;
  }

  const modalRoot = document.getElementById('modal-root');
  if (!modalRoot) {
    return null;
  }

  const confirmButtonStyle =
    variant === 'danger'
      ? {
          background: 'var(--accent-danger)',
          boxShadow: '0 16px 40px rgba(239, 68, 68, 0.22)',
        }
      : {
          background: 'var(--accent-primary)',
          boxShadow: '0 16px 40px rgba(79, 123, 247, 0.22)',
        };

  return createPortal(
    <>
      <style>{`
        @keyframes confirmDialogFade {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes confirmDialogScale {
          from {
            opacity: 0;
            transform: translateY(10px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>

      <div
        aria-hidden="true"
        onClick={onCancel}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 200,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          background: 'rgba(7, 10, 18, 0.72)',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
          animation: 'confirmDialogFade 180ms ease forwards',
        }}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          onClick={(event) => event.stopPropagation()}
          style={{
            width: '100%',
            maxWidth: '460px',
            background:
              'linear-gradient(180deg, rgba(36, 40, 54, 0.96), rgba(26, 29, 39, 0.98))',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '24px',
            padding: '28px',
            boxShadow: '0 32px 80px rgba(0, 0, 0, 0.35)',
            animation:
              'confirmDialogScale 220ms cubic-bezier(0.16, 1, 0.3, 1) forwards',
          }}
        >
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '18px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '18px',
              background:
                variant === 'danger'
                  ? 'rgba(239, 68, 68, 0.14)'
                  : 'rgba(79, 123, 247, 0.14)',
              border:
                variant === 'danger'
                  ? '1px solid rgba(239, 68, 68, 0.24)'
                  : '1px solid rgba(79, 123, 247, 0.24)',
            }}
          >
            <div
              style={{
                width: '12px',
                height: '12px',
                borderRadius: '999px',
                background:
                  variant === 'danger'
                    ? 'var(--accent-danger)'
                    : 'var(--accent-primary)',
              }}
            />
          </div>

          <h2
            id={titleId}
            style={{
              margin: 0,
              fontFamily: 'var(--font-display)',
              fontSize: '1.5rem',
              letterSpacing: '-0.03em',
              color: 'var(--text-primary)',
            }}
          >
            {title}
          </h2>

          <p
            style={{
              margin: '12px 0 0',
              fontSize: '0.95rem',
              lineHeight: 1.7,
              color: 'var(--text-secondary)',
            }}
          >
            {message}
          </p>

          <div
            style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end',
              marginTop: '28px',
              flexWrap: 'wrap',
            }}
          >
            <button
              type="button"
              onClick={onCancel}
              style={{
                minWidth: '120px',
                padding: '12px 18px',
                borderRadius: '14px',
                border: '1px solid var(--border-default)',
                background: 'transparent',
                color: 'var(--text-secondary)',
                fontFamily: 'var(--font-body)',
                fontSize: '0.95rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {cancelText}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              style={{
                minWidth: '140px',
                padding: '12px 18px',
                borderRadius: '14px',
                border: 'none',
                color: '#ffffff',
                fontFamily: 'var(--font-body)',
                fontSize: '0.95rem',
                fontWeight: 700,
                cursor: 'pointer',
                ...confirmButtonStyle,
              }}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </>,
    modalRoot
  );
}
