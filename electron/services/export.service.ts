import { writeFile } from 'node:fs/promises';

import { BrowserWindow, dialog } from 'electron';

import type {
  SaveScoreboardImageInput,
  SaveScoreboardImageResult,
} from '../../src/types';

const PNG_DATA_URL_PREFIX = 'data:image/png;base64,';
const MAX_PNG_BYTES = 40 * 1024 * 1024;
const PNG_SIGNATURE = [137, 80, 78, 71, 13, 10, 26, 10];

function normalizePngFileName(fileName: string): string {
  const withoutExtension = fileName.trim().replace(/\.png$/i, '');
  const withoutControlCharacters = Array.from(withoutExtension)
    .filter((character) => character.charCodeAt(0) > 31)
    .join('');
  const safeBaseName = withoutControlCharacters
    .replace(/[<>:"/\\|?*]/g, '-')
    .replace(/^\.+|\.+$/g, '')
    .replace(/\s+/g, ' ')
    .slice(0, 120)
    .trim();

  return `${safeBaseName || 'תוצאות-החידון'}.png`;
}

function decodePngDataUrl(dataUrl: string): Buffer {
  if (!dataUrl.startsWith(PNG_DATA_URL_PREFIX)) {
    throw new Error('קובץ התוצאות שהתקבל אינו תמונת PNG תקינה.');
  }

  const encoded = dataUrl.slice(PNG_DATA_URL_PREFIX.length);
  if (
    !encoded ||
    encoded.length > Math.ceil((MAX_PNG_BYTES * 4) / 3) + 4 ||
    !/^[a-z\d+/]+={0,2}$/i.test(encoded)
  ) {
    throw new Error('קובץ התוצאות שהתקבל אינו תקין או גדול מדי.');
  }

  const image = Buffer.from(encoded, 'base64');
  if (
    image.length === 0 ||
    image.length > MAX_PNG_BYTES ||
    PNG_SIGNATURE.some((byte, index) => image[index] !== byte)
  ) {
    throw new Error('קובץ התוצאות שהתקבל אינו תמונת PNG תקינה.');
  }

  return image;
}

export async function saveScoreboardImage(
  data: SaveScoreboardImageInput,
  parentWindow: BrowserWindow | null,
): Promise<SaveScoreboardImageResult> {
  const image = decodePngDataUrl(data.dataUrl);
  const options = {
    title: 'שמירת תמונת התוצאות',
    defaultPath: normalizePngFileName(data.defaultFileName),
    filters: [{ name: 'תמונת PNG', extensions: ['png'] }],
  };
  const result = parentWindow
    ? await dialog.showSaveDialog(parentWindow, options)
    : await dialog.showSaveDialog(options);

  if (result.canceled || !result.filePath) {
    return { saved: false, filePath: null };
  }

  await writeFile(result.filePath, image);
  return { saved: true, filePath: result.filePath };
}
