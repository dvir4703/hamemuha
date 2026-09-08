import { randomUUID } from 'node:crypto';
import {
  copyFileSync,
  createReadStream,
  existsSync,
  mkdirSync,
  statSync,
} from 'node:fs';
import { readFile } from 'node:fs/promises';
import { extname, isAbsolute, join, normalize, resolve, sep } from 'node:path';
import { Readable } from 'node:stream';

import { app, protocol } from 'electron';

const MEDIA_SCHEME = 'app-media';
const IMAGE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg']);
const QUESTION_MEDIA_EXTENSIONS = new Set([
  ...IMAGE_EXTENSIONS,
  '.mp4',
  '.mp3',
]);
const CATEGORY_PATTERN = /^[a-z0-9_-]+$/i;

const MIME_TYPES: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.mp4': 'video/mp4',
  '.mp3': 'audio/mpeg',
};

function resolveImagePath(relativePath: string): string {
  return resolveStoredFilePath(
    relativePath,
    new Set(['images']),
    IMAGE_EXTENSIONS,
  );
}

function resolveMediaPath(relativePath: string): string {
  return resolveStoredFilePath(
    relativePath,
    new Set(['images', 'media']),
    QUESTION_MEDIA_EXTENSIONS,
  );
}

function resolveStoredFilePath(
  relativePath: string,
  allowedRoots: Set<string>,
  allowedExtensions: Set<string>,
): string {
  if (!relativePath || isAbsolute(relativePath)) {
    throw new Error('נתיב המדיה אינו תקין.');
  }

  const normalizedRelativePath = normalize(relativePath).replaceAll('\\', '/');
  const [rootName] = normalizedRelativePath.split('/');

  if (
    !allowedRoots.has(rootName) ||
    !normalizedRelativePath.startsWith(`${rootName}/`) ||
    normalizedRelativePath.includes('../')
  ) {
    throw new Error('נתיב המדיה אינו מורשה.');
  }

  const storageRoot = resolve(app.getPath('userData'), rootName);
  const absolutePath = resolve(app.getPath('userData'), normalizedRelativePath);

  if (
    absolutePath !== storageRoot &&
    !absolutePath.startsWith(`${storageRoot}${sep}`)
  ) {
    throw new Error('נתיב המדיה חורג מתיקיית האחסון.');
  }

  if (!allowedExtensions.has(extname(absolutePath).toLowerCase())) {
    throw new Error('סוג קובץ המדיה אינו מורשה.');
  }

  return absolutePath;
}

export function registerImageScheme(): void {
  protocol.registerSchemesAsPrivileged([
    {
      scheme: MEDIA_SCHEME,
      privileges: {
        secure: true,
        standard: true,
        supportFetchAPI: true,
        stream: true,
      },
    },
  ]);
}

export function registerImageProtocol(): void {
  protocol.handle(MEDIA_SCHEME, (request) => {
    try {
      const requestUrl = new URL(request.url);
      const relativePath = decodeURIComponent(requestUrl.pathname.slice(1));
      const absolutePath = resolveMediaPath(relativePath);

      if (!existsSync(absolutePath)) {
        return new Response('Media not found', { status: 404 });
      }

      const size = statSync(absolutePath).size;
      const range = request.headers.get('range');
      const headers = new Headers({
        'Accept-Ranges': 'bytes',
        'Content-Type': MIME_TYPES[extname(absolutePath).toLowerCase()],
      });

      if (range) {
        const match = /^bytes=(\d*)-(\d*)$/.exec(range);
        if (!match) {
          headers.set('Content-Range', `bytes */${size}`);
          return new Response(null, { status: 416, headers });
        }

        const suffixLength = !match[1] && match[2] ? Number(match[2]) : null;
        const start = suffixLength
          ? Math.max(size - suffixLength, 0)
          : Number(match[1]);
        const end = suffixLength
          ? size - 1
          : match[2]
            ? Number(match[2])
            : size - 1;
        if (start >= size || start > end) {
          headers.set('Content-Range', `bytes */${size}`);
          return new Response(null, { status: 416, headers });
        }
        const boundedEnd = Math.min(end, size - 1);
        const contentLength = boundedEnd - start + 1;
        headers.set('Content-Length', String(contentLength));
        headers.set('Content-Range', `bytes ${start}-${boundedEnd}/${size}`);
        const body =
          request.method === 'HEAD'
            ? null
            : (Readable.toWeb(
                createReadStream(absolutePath, { start, end: boundedEnd }),
              ) as BodyInit);
        return new Response(body, { status: 206, headers });
      }

      headers.set('Content-Length', String(size));
      const body =
        request.method === 'HEAD'
          ? null
          : (Readable.toWeb(createReadStream(absolutePath)) as BodyInit);
      return new Response(body, { status: 200, headers });
    } catch {
      return new Response('Invalid media path', { status: 400 });
    }
  });
}

export function saveImage(sourcePath: string, category: string): string {
  if (!CATEGORY_PATTERN.test(category)) {
    throw new Error('קטגוריית התמונה אינה תקינה.');
  }

  const extension = extname(sourcePath).toLowerCase();

  if (!IMAGE_EXTENSIONS.has(extension)) {
    throw new Error('ניתן לבחור תמונת PNG או JPG בלבד.');
  }

  if (!existsSync(sourcePath)) {
    throw new Error('קובץ התמונה שנבחר לא נמצא.');
  }

  const fileName = `${randomUUID()}${extension}`;
  const relativePath = `images/${category}/${fileName}`;
  const targetDirectory = join(app.getPath('userData'), 'images', category);

  mkdirSync(targetDirectory, { recursive: true });
  copyFileSync(sourcePath, join(targetDirectory, fileName));

  return relativePath;
}

export function getImageUrl(relativePath: string): string {
  resolveImagePath(relativePath);

  return buildMediaUrl(relativePath);
}

export function saveMedia(sourcePath: string, category: string): string {
  if (!CATEGORY_PATTERN.test(category)) {
    throw new Error('קטגוריית המדיה אינה תקינה.');
  }

  const extension = extname(sourcePath).toLowerCase();
  if (!QUESTION_MEDIA_EXTENSIONS.has(extension)) {
    throw new Error('ניתן לבחור קובץ PNG, JPG, MP4 או MP3 בלבד.');
  }
  if (!existsSync(sourcePath)) {
    throw new Error('קובץ המדיה שנבחר לא נמצא.');
  }

  const fileName = `${randomUUID()}${extension}`;
  const relativePath = `media/${category}/${fileName}`;
  const targetDirectory = join(app.getPath('userData'), 'media', category);

  mkdirSync(targetDirectory, { recursive: true });
  copyFileSync(sourcePath, join(targetDirectory, fileName));
  return relativePath;
}

export function getMediaUrl(relativePath: string): string {
  resolveMediaPath(relativePath);
  return buildMediaUrl(relativePath);
}

function buildMediaUrl(relativePath: string): string {
  const encodedPath = relativePath
    .replaceAll('\\', '/')
    .split('/')
    .map(encodeURIComponent)
    .join('/');

  return `${MEDIA_SCHEME}://local/${encodedPath}`;
}

export async function getImageDataUrl(relativePath: string): Promise<string> {
  const absolutePath = resolveImagePath(relativePath);
  const extension = extname(absolutePath).toLowerCase();
  const mimeType = extension === '.png' ? 'image/png' : 'image/jpeg';
  const image = await readFile(absolutePath);
  return `data:${mimeType};base64,${image.toString('base64')}`;
}
