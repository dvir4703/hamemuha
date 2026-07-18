import { useEffect, useRef } from 'react';
import { AlertTriangle, LoaderCircle, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

interface LiveConfirmationDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  isBusy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function LiveConfirmationDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel = 'ביטול',
  isBusy = false,
  onConfirm,
  onCancel,
}: LiveConfirmationDialogProps) {
  const dialogRef = useRef<HTMLElement>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    previouslyFocusedRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    cancelButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isBusy) {
        event.preventDefault();
        onCancel();
        return;
      }

      if (event.key !== 'Tab') return;

      const focusableElements = Array.from(
        dialogRef.current?.querySelectorAll<HTMLElement>(
          'button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])',
        ) ?? [],
      );
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (!firstElement || !lastElement) return;

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      previouslyFocusedRef.current?.focus();
    };
  }, [isBusy, onCancel, open]);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[70] grid place-items-center bg-ink/65 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="live-confirmation-title"
          aria-describedby="live-confirmation-description"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !isBusy) onCancel();
          }}
        >
          <motion.section
            ref={dialogRef}
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="w-full max-w-lg rounded-[28px] bg-white p-6 text-ink shadow-dialog sm:p-8"
          >
            <div className="flex items-start justify-between gap-4">
              <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-amber/15 text-amber-dark">
                <AlertTriangle size={28} aria-hidden="true" />
              </span>
              <button
                type="button"
                onClick={onCancel}
                disabled={isBusy}
                className="rounded-xl p-2 text-ink/40 transition hover:bg-canvas hover:text-ink focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal/20 disabled:opacity-35"
                aria-label="סגירת חלון האישור"
              >
                <X size={21} aria-hidden="true" />
              </button>
            </div>

            <h2
              id="live-confirmation-title"
              className="mt-5 font-display text-3xl font-black"
            >
              {title}
            </h2>
            <p
              id="live-confirmation-description"
              className="mt-3 text-lg font-semibold leading-relaxed text-ink/60"
            >
              {description}
            </p>

            <div className="mt-7 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                ref={cancelButtonRef}
                type="button"
                onClick={onCancel}
                disabled={isBusy}
                className="rounded-xl border border-ink/10 px-5 py-3 font-bold text-ink/65 transition hover:bg-canvas focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal/20 disabled:opacity-35"
              >
                {cancelLabel}
              </button>
              <button
                type="button"
                onClick={onConfirm}
                disabled={isBusy}
                className="inline-flex min-w-40 items-center justify-center gap-2 rounded-xl bg-ink px-5 py-3 font-bold text-white shadow-button transition hover:bg-hero focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal/20 disabled:opacity-45"
              >
                {isBusy ? (
                  <LoaderCircle className="animate-spin" size={18} />
                ) : null}
                {confirmLabel}
              </button>
            </div>
          </motion.section>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
