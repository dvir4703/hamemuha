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
          className="fixed inset-0 z-[70] grid place-items-center bg-[#02030b]/88 p-4 backdrop-blur-xl"
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
            className="w-full max-w-lg rounded-[28px] border border-[#ffe08a]/25 bg-[#0b1026]/95 p-6 text-center text-[#f6f7ff] shadow-[0_30px_90px_rgba(0,0,0,0.62),0_0_42px_rgba(244,185,66,0.1)] sm:p-8"
          >
            <div className="flex items-start justify-between gap-4">
              <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full border border-[#f4b942]/30 bg-[#f4b942]/10 text-[#ffe08a]">
                <AlertTriangle size={28} aria-hidden="true" />
              </span>
              <button
                type="button"
                onClick={onCancel}
                disabled={isBusy}
                className="rounded-xl p-2 text-white/45 transition hover:bg-white/5 hover:text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#f4b942]/25 disabled:opacity-35"
                aria-label="סגירת חלון האישור"
              >
                <X size={21} aria-hidden="true" />
              </button>
            </div>

            <h2
              id="live-confirmation-title"
              className="mt-5 font-display text-3xl font-extrabold"
            >
              {title}
            </h2>
            <p
              id="live-confirmation-description"
              className="mt-3 text-lg font-semibold leading-relaxed text-white/60"
            >
              {description}
            </p>

            <div className="mt-7 flex flex-col-reverse justify-center gap-2 sm:flex-row">
              <button
                ref={cancelButtonRef}
                type="button"
                onClick={onCancel}
                disabled={isBusy}
                className="rounded-xl border border-white/15 bg-white/[0.04] px-5 py-3 font-bold text-white/70 transition hover:border-white/25 hover:bg-white/[0.08] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#f4b942]/25 disabled:opacity-35"
              >
                {cancelLabel}
              </button>
              <button
                type="button"
                onClick={onConfirm}
                disabled={isBusy}
                className="inline-flex min-w-40 items-center justify-center gap-2 rounded-xl border border-[#ffe08a]/45 bg-gradient-to-r from-[#d58d18] via-[#f4b942] to-[#ffe08a] px-5 py-3 font-extrabold text-[#050713] shadow-[0_12px_32px_rgba(244,185,66,0.22)] transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#f4b942]/25 disabled:opacity-45"
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
