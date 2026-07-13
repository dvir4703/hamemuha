import { ImagePlus, LoaderCircle, Trash2 } from 'lucide-react';

interface QuestionImagePickerProps {
  imageUrl: string | null;
  isSelecting: boolean;
  onSelect: () => void;
  onRemove: () => void;
  label?: string;
}

export function QuestionImagePicker({
  imageUrl,
  isSelecting,
  onSelect,
  onRemove,
  label = 'תמונה לשאלה',
}: QuestionImagePickerProps) {
  return (
    <div>
      <span className="mb-2 block text-sm font-bold text-ink/65">{label}</span>
      {imageUrl ? (
        <div className="relative overflow-hidden rounded-[20px] border border-ink/10 bg-canvas">
          <img
            src={imageUrl}
            alt="תצוגה מקדימה"
            className="h-52 w-full object-contain"
          />
          <div className="absolute bottom-3 left-3 flex gap-2">
            <button
              type="button"
              onClick={onSelect}
              className="rounded-xl bg-white/95 px-3 py-2 text-sm font-bold text-teal shadow-md hover:bg-white"
            >
              החלפת תמונה
            </button>
            <button
              type="button"
              onClick={onRemove}
              className="grid h-10 w-10 place-items-center rounded-xl bg-white/95 text-coral shadow-md hover:bg-white"
              aria-label="הסרת תמונה"
            >
              <Trash2 size={18} />
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={onSelect}
          disabled={isSelecting}
          className="flex w-full items-center justify-center gap-3 rounded-[20px] border border-dashed border-ink/15 bg-canvas/70 px-5 py-8 font-bold text-ink/50 transition hover:border-teal/40 hover:bg-teal/5 hover:text-teal disabled:opacity-50"
        >
          {isSelecting ? (
            <LoaderCircle className="animate-spin" size={22} />
          ) : (
            <ImagePlus size={23} />
          )}
          {isSelecting ? 'פותחים את בוחר התמונות…' : 'בחירת תמונה מהמחשב'}
        </button>
      )}
      <p className="mt-2 text-xs text-ink/40">
        PNG או JPG · התמונה נשמרת מקומית עם החידון
      </p>
    </div>
  );
}
