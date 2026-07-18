import { useEffect, useState } from 'react';

interface ResolvedImageData {
  path: string;
  url: string;
}

export function useImageDataUrl(relativePath: string | null): string | null {
  const [resolvedImage, setResolvedImage] = useState<ResolvedImageData | null>(
    null,
  );

  useEffect(() => {
    if (!relativePath) return;

    let isActive = true;
    void window.api.file
      .getImageDataUrl(relativePath)
      .then((url) => {
        if (isActive) setResolvedImage({ path: relativePath, url });
      })
      .catch(() => {
        if (isActive) setResolvedImage(null);
      });

    return () => {
      isActive = false;
    };
  }, [relativePath]);

  return resolvedImage?.path === relativePath ? resolvedImage.url : null;
}
