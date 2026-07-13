import { useEffect, useRef, useState } from 'react';
import { ImagePlus, LoaderCircle, Plus, X } from 'lucide-react';
import { motion } from 'framer-motion';

import type { QuizMutationInput } from '../../types';

interface CreateQuizModalProps {
  onClose: () => void;
  onCreate: (data: QuizMutationInput) => Promise<void>;
}

export function CreateQuizModal({ onClose, onCreate }: CreateQuizModalProps) {
  const [name, setName] = useState('');
  const [logoPath, setLogoPath] = useState<string | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSelectingImage, setIsSelectingImage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    nameInputRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isSaving) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isSaving, onClose]);

  const handleSelectLogo = async () => {
    setIsSelectingImage(true);
    setError(null);

    try {
      const selectedPath =
        await window.api.file.selectAndSaveImage('quiz-logos');

      if (selectedPath) {
        const selectedUrl = await window.api.file.getImageUrl(selectedPath);
        setLogoPath(selectedPath);
        setLogoUrl(selectedUrl);
      }
    } catch {
      setError('לא הצלחנו לשמור את התמונה. נסו לבחור קובץ אחר.');
    } finally {
      setIsSelectingImage(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedName = name.trim();

    if (!trimmedName) {
      setError('כדי להמשיך, צריך לתת לחידון שם.');
      nameInputRef.current?.focus();
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      await onCreate({ name: trimmedName, logoPath });
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'יצירת החידון לא הושלמה. נסו שוב.',
      );
      setIsSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-ink/55 p-4 backdrop-blur-sm"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isSaving) {
          onClose();
        }
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 18, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.98 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="w-full max-w-lg overflow-hidden rounded-[28px] bg-white shadow-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-quiz-title"
      >
        <div className="flex items-start justify-between border-b border-ink/10 px-7 py-6">
          <div>
            <p className="mb-1 text-sm font-bold text-teal">חידון חדש</p>
            <h2
              id="create-quiz-title"
              className="font-display text-2xl font-bold text-ink"
            >
              מתחילים בשם טוב
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="rounded-full p-2 text-ink/55 transition hover:bg-canvas hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal disabled:opacity-40"
            aria-label="סגירת חלון יצירת חידון"
          >
            <X aria-hidden="true" size={20} />
          </button>
        </div>

        <form className="space-y-6 px-7 py-7" onSubmit={handleSubmit}>
          <div>
            <label
              htmlFor="quiz-name"
              className="mb-2 block text-sm font-bold text-ink"
            >
              שם החידון
            </label>
            <input
              ref={nameInputRef}
              id="quiz-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="w-full rounded-2xl border border-ink/15 bg-white px-4 py-3.5 text-lg text-ink outline-none transition placeholder:text-ink/35 focus:border-teal focus:ring-4 focus:ring-teal/10"
              placeholder="למשל: חידון תנ״ך — כיתה ו׳"
              maxLength={120}
              required
            />
          </div>

          <div>
            <span className="mb-2 block text-sm font-bold text-ink">
              לוגו לחידון{' '}
              <span className="font-normal text-ink/45">(רשות)</span>
            </span>
            <button
              type="button"
              onClick={() => void handleSelectLogo()}
              disabled={isSelectingImage || isSaving}
              className="group flex w-full items-center gap-4 rounded-2xl border border-dashed border-ink/20 bg-canvas/70 p-4 text-right transition hover:border-teal/60 hover:bg-teal/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal disabled:cursor-wait disabled:opacity-60"
            >
              <span className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-2xl bg-white text-teal shadow-sm">
                {logoUrl ? (
                  <img
                    src={logoUrl}
                    alt="תצוגה מקדימה של הלוגו"
                    className="h-full w-full object-cover"
                  />
                ) : isSelectingImage ? (
                  <LoaderCircle className="animate-spin" aria-hidden="true" />
                ) : (
                  <ImagePlus aria-hidden="true" />
                )}
              </span>
              <span>
                <span className="block font-bold text-ink">
                  {logoPath ? 'החלפת התמונה' : 'בחירת תמונה מהמחשב'}
                </span>
                <span className="mt-1 block text-sm text-ink/55">
                  PNG או JPG — אפשר להוסיף גם אחר כך
                </span>
              </span>
            </button>
          </div>

          {error ? (
            <p
              className="rounded-xl bg-coral/10 px-4 py-3 text-sm font-semibold text-red-800"
              role="alert"
            >
              {error}
            </p>
          ) : null}

          <div className="flex items-center justify-end gap-3 border-t border-ink/10 pt-5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="rounded-xl px-5 py-3 font-bold text-ink/65 transition hover:bg-canvas hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal disabled:opacity-40"
            >
              ביטול
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex min-w-36 items-center justify-center gap-2 rounded-xl bg-teal px-5 py-3 font-bold text-white shadow-button transition hover:bg-teal-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal disabled:cursor-wait disabled:opacity-60"
            >
              {isSaving ? (
                <LoaderCircle
                  className="animate-spin"
                  aria-hidden="true"
                  size={19}
                />
              ) : (
                <Plus aria-hidden="true" size={19} />
              )}
              יצירת חידון
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
