import { useEffect } from 'react';
import { CheckCircle2, X } from 'lucide-react';
import { motion } from 'framer-motion';

interface ToastProps {
  message: string;
  onClose: () => void;
}

export function Toast({ message, onClose }: ToastProps) {
  useEffect(() => {
    const timeout = window.setTimeout(onClose, 3200);
    return () => window.clearTimeout(timeout);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 12, scale: 0.98 }}
      className="fixed bottom-6 left-6 z-[60] flex min-w-72 items-center gap-3 rounded-2xl border border-teal/15 bg-ink px-4 py-3.5 text-white shadow-dialog"
      role="status"
      aria-live="polite"
    >
      <CheckCircle2 className="shrink-0 text-mint" aria-hidden="true" />
      <span className="flex-1 font-semibold">{message}</span>
      <button
        type="button"
        onClick={onClose}
        className="rounded-full p-1 text-white/60 hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        aria-label="סגירת ההודעה"
      >
        <X size={17} aria-hidden="true" />
      </button>
    </motion.div>
  );
}
