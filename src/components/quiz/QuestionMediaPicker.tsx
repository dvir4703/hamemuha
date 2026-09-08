import {
  FileVideo2,
  ImagePlus,
  LoaderCircle,
  Music2,
  Trash2,
} from 'lucide-react';

import { getQuestionMediaType } from '../../utils/media';

interface QuestionMediaPickerProps {
  mediaPath: string | null;
  mediaUrl: string | null;
  isSelecting: boolean;
  onSelect: () => void;
  onRemove: () => void;
  label?: string;
}

export function QuestionMediaPicker({
  mediaPath,
  mediaUrl,
  isSelecting,
  onSelect,
  onRemove,
  label = 'מדיה לשאלה',
}: QuestionMediaPickerProps) {
  const mediaType = getQuestionMediaType(mediaPath);

  return (
    <div>
      <span className="mb-2 block text-sm font-bold text-ink/65">{label}</span>
      {mediaUrl && mediaType ? (
        <div className="overflow-hidden rounded-[20px] border border-ink/10 bg-canvas">
          <div className="flex min-h-52 items-center justify-center bg-ink/[0.025] p-3">
            {mediaType === 'image' ? (
              <img
                src={mediaUrl}
                alt="תצוגה מקדימה"
                className="h-52 w-full object-contain"
              />
            ) : null}
            {mediaType === 'video' ? (
              <video
                src={mediaUrl}
                controls
                playsInline
                preload="metadata"
                className="max-h-64 w-full rounded-xl bg-black"
                aria-label="תצוגה מקדימה של הווידאו"
              />
            ) : null}
            {mediaType === 'audio' ? (
              <div className="w-full max-w-lg rounded-2xl bg-white px-5 py-7 text-center shadow-sm">
                <Music2
                  className="mx-auto mb-4 text-violet"
                  size={34}
                  aria-hidden="true"
                />
                <audio
                  src={mediaUrl}
                  controls
                  preload="metadata"
                  className="w-full"
                  aria-label="תצוגה מקדימה של האודיו"
                />
              </div>
            ) : null}
          </div>
          <div className="flex items-center justify-between gap-3 border-t border-ink/10 bg-white px-3 py-3">
            <span className="inline-flex items-center gap-2 text-sm font-bold text-ink/55">
              {mediaType === 'image' ? <ImagePlus size={17} /> : null}
              {mediaType === 'video' ? <FileVideo2 size={17} /> : null}
              {mediaType === 'audio' ? <Music2 size={17} /> : null}
              {mediaType === 'image'
                ? 'תמונה מצורפת'
                : mediaType === 'video'
                  ? 'וידאו מצורף'
                  : 'אודיו מצורף'}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onSelect}
                disabled={isSelecting}
                className="rounded-xl bg-canvas px-3 py-2 text-sm font-bold text-teal hover:bg-teal/10 disabled:opacity-50"
              >
                החלפת מדיה
              </button>
              <button
                type="button"
                onClick={onRemove}
                className="grid h-10 w-10 place-items-center rounded-xl bg-canvas text-coral hover:bg-coral/10"
                aria-label="הסרת מדיה"
              >
                <Trash2 size={18} />
              </button>
            </div>
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
            <span className="inline-flex items-center gap-1" aria-hidden="true">
              <ImagePlus size={22} />
              <FileVideo2 size={22} />
              <Music2 size={22} />
            </span>
          )}
          {isSelecting ? 'פותחים את בוחר המדיה…' : 'בחירת מדיה מהמחשב'}
        </button>
      )}
      <p className="mt-2 text-xs text-ink/40">
        PNG, JPG, MP4 או MP3 · ניתן לצרף פריט מדיה אחד לכל שאלה
      </p>
    </div>
  );
}
