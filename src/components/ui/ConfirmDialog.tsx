import { useEffect, useRef } from 'react';
import { AlertTriangle, LoaderCircle, X } from 'lucide-react';
import { motion } from 'framer-motion';

interface ConfirmDialogProps {
  quizName: string;
  isDeleting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function ConfirmDialog({
  quizName,
  isDeleting,
  onCancel,
  onConfirm,
}: ConfirmDialogProps) {
  const cancelButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    cancelButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isDeleting) {
        onCancel();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isDeleting, onCancel]);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink/55 p-4 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.98 }}
        className="w-full max-w-md rounded-[26px] bg-white p-7 shadow-dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
      >
        <div className="mb-5 flex items-start justify-between">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-coral/[0.12] text-coral">
            <AlertTriangle aria-hidden="true" />
          </span>
          <button
            ref={cancelButtonRef}
            type="button"
            onClick={onCancel}
            disabled={isDeleting}
            className="rounded-full p-2 text-ink/50 hover:bg-canvas hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal"
            aria-label="ביטול המחיקה"
          >
            <X aria-hidden="true" size={20} />
          </button>
        </div>
        <h2
          id="delete-dialog-title"
          className="font-display text-2xl font-bold text-ink"
        >
          למחוק את החידון?
        </h2>
        <p
          id="delete-dialog-description"
          className="mt-3 leading-7 text-ink/65"
        >
          האם למחוק את החידון <strong>„{quizName}”</strong>? הפעולה תמחק גם את
          המתמודדים והשאלות ולא ניתן לבטל אותה.
        </p>
        <div className="mt-7 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isDeleting}
            className="rounded-xl px-5 py-3 font-bold text-ink/65 hover:bg-canvas hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal"
          >
            ביטול
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="inline-flex min-w-28 items-center justify-center gap-2 rounded-xl bg-coral px-5 py-3 font-bold text-white transition hover:bg-red-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral disabled:cursor-wait disabled:opacity-60"
          >
            {isDeleting ? (
              <LoaderCircle
                className="animate-spin"
                size={18}
                aria-hidden="true"
              />
            ) : null}
            מחיקה
          </button>
        </div>
      </motion.div>
    </div>
  );
}
