import { useEffect, useRef } from 'react';
import { AlertTriangle, LoaderCircle, X } from 'lucide-react';
import { motion } from 'framer-motion';

interface ActionConfirmDialogProps {
  title: string;
  description: string;
  confirmLabel?: string;
  isWorking?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function ActionConfirmDialog({
  title,
  description,
  confirmLabel = 'מחיקה',
  isWorking = false,
  onCancel,
  onConfirm,
}: ActionConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    cancelRef.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isWorking) onCancel();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isWorking, onCancel]);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink/55 p-4 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, y: 14, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.98 }}
        className="w-full max-w-md rounded-[26px] bg-white p-7 shadow-dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="action-dialog-title"
        aria-describedby="action-dialog-description"
      >
        <div className="mb-5 flex items-start justify-between">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-coral/[0.12] text-coral">
            <AlertTriangle aria-hidden="true" />
          </span>
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            disabled={isWorking}
            className="rounded-full p-2 text-ink/45 hover:bg-canvas hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal"
            aria-label="ביטול"
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>
        <h2
          id="action-dialog-title"
          className="font-display text-2xl font-black"
        >
          {title}
        </h2>
        <p
          id="action-dialog-description"
          className="mt-3 leading-7 text-ink/65"
        >
          {description}
        </p>
        <div className="mt-7 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isWorking}
            className="rounded-xl px-5 py-3 font-bold text-ink/65 hover:bg-canvas hover:text-ink"
          >
            ביטול
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isWorking}
            className="inline-flex min-w-28 items-center justify-center gap-2 rounded-xl bg-coral px-5 py-3 font-bold text-white hover:bg-red-700 disabled:opacity-60"
          >
            {isWorking ? (
              <LoaderCircle className="animate-spin" size={18} />
            ) : null}
            {confirmLabel}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
