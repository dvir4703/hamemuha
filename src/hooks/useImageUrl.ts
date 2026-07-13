import { useEffect, useState } from 'react';

interface ResolvedImage {
  path: string;
  url: string;
}

export function useImageUrl(relativePath: string | null): string | null {
  const [resolvedImage, setResolvedImage] = useState<ResolvedImage | null>(
    null,
  );

  useEffect(() => {
    if (!relativePath) {
      return;
    }

    let isActive = true;

    void window.api.file
      .getImageUrl(relativePath)
      .then((url) => {
        if (isActive) {
          setResolvedImage({ path: relativePath, url });
        }
      })
      .catch(() => {
        if (isActive) {
          setResolvedImage(null);
        }
      });

    return () => {
      isActive = false;
    };
  }, [relativePath]);

  return resolvedImage?.path === relativePath ? resolvedImage.url : null;
}
