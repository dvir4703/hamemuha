export type QuestionMediaType = 'image' | 'video' | 'audio';

const IMAGE_EXTENSIONS = new Set(['png', 'jpg', 'jpeg']);

export function getQuestionMediaType(
  mediaPath: string | null,
): QuestionMediaType | null {
  if (!mediaPath) return null;

  const extension = mediaPath.split('.').pop()?.toLowerCase();
  if (!extension) return null;
  if (IMAGE_EXTENSIONS.has(extension)) return 'image';
  if (extension === 'mp4') return 'video';
  if (extension === 'mp3') return 'audio';
  return null;
}
