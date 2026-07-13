import { randomUUID } from 'node:crypto';
import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { extname, isAbsolute, join, normalize, resolve, sep } from 'node:path';
import { pathToFileURL } from 'node:url';

import { app, net, protocol } from 'electron';

const IMAGE_SCHEME = 'app-media';
const ALLOWED_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg']);
const CATEGORY_PATTERN = /^[a-z0-9_-]+$/i;

function resolveImagePath(relativePath: string): string {
  if (!relativePath || isAbsolute(relativePath)) {
    throw new Error('נתיב התמונה אינו תקין.');
  }

  const normalizedRelativePath = normalize(relativePath).replaceAll('\\', '/');

  if (
    !normalizedRelativePath.startsWith('images/') ||
    normalizedRelativePath.includes('../')
  ) {
    throw new Error('נתיב התמונה אינו מורשה.');
  }

  const imagesRoot = resolve(app.getPath('userData'), 'images');
  const absolutePath = resolve(app.getPath('userData'), normalizedRelativePath);

  if (
    absolutePath !== imagesRoot &&
    !absolutePath.startsWith(`${imagesRoot}${sep}`)
  ) {
    throw new Error('נתיב התמונה חורג מתיקיית התמונות.');
  }

  return absolutePath;
}

export function registerImageScheme(): void {
  protocol.registerSchemesAsPrivileged([
    {
      scheme: IMAGE_SCHEME,
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
  protocol.handle(IMAGE_SCHEME, (request) => {
    try {
      const requestUrl = new URL(request.url);
      const relativePath = decodeURIComponent(requestUrl.pathname.slice(1));
      const absolutePath = resolveImagePath(relativePath);

      if (!existsSync(absolutePath)) {
        return new Response('Image not found', { status: 404 });
      }

      return net.fetch(pathToFileURL(absolutePath).toString());
    } catch {
      return new Response('Invalid image path', { status: 400 });
    }
  });
}

export function saveImage(sourcePath: string, category: string): string {
  if (!CATEGORY_PATTERN.test(category)) {
    throw new Error('קטגוריית התמונה אינה תקינה.');
  }

  const extension = extname(sourcePath).toLowerCase();

  if (!ALLOWED_EXTENSIONS.has(extension)) {
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

  const encodedPath = relativePath
    .replaceAll('\\', '/')
    .split('/')
    .map(encodeURIComponent)
    .join('/');

  return `${IMAGE_SCHEME}://local/${encodedPath}`;
}
