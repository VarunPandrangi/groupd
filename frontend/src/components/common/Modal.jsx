import * as Dialog from '@radix-ui/react-dialog';
import { AnimatePresence, motion as Motion } from 'framer-motion';
import { X } from '@phosphor-icons/react';
import Button from './Button';

export default function Modal({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  maxWidth = 520,
  showClose = false,
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open ? (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild>
              <Motion.div
                className="w-full dialog-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
              />
            </Dialog.Overlay>
            <Dialog.Content asChild forceMount>
              <Motion.div
                className="w-full max-w-lg dialog-content"
                style={{ maxWidth }}
                initial={{ opacity: 0, scale: 0.96, x: '-50%', y: '-48%' }}
                animate={{ opacity: 1, scale: 1, x: '-50%', y: '-50%' }}
                exit={{ opacity: 0, scale: 0.96, x: '-50%', y: '-48%' }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              >
                <div className="rounded-xl border rounded-2xl dialog-card">
                  <div className="flex items-start justify-between gap-3 card__header">
                    <div>
                      {title ? <Dialog.Title className="text-lg font-bold dialog-title">{title}</Dialog.Title> : null}
                      {description ? (
                        <Dialog.Description className="text-sm leading-relaxed dialog-description">
                          {description}
                        </Dialog.Description>
                      ) : null}
                    </div>
                    {showClose ? (
                      <Dialog.Close asChild>
                        <Button type="button" variant="icon" iconOnly aria-label="Close dialog">
                          <X size={18} />
                        </Button>
                      </Dialog.Close>
                    ) : null}
                  </div>
                  {children}
                  {footer ? <div className="flex justify-between gap-3 dialog-actions">{footer}</div> : null}
                </div>
              </Motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        ) : null}
      </AnimatePresence>
    </Dialog.Root>
  );
}
