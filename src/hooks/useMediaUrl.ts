import { useEffect, useState } from 'react';

interface ResolvedMedia {
  path: string;
  url: string;
}

export function useMediaUrl(relativePath: string | null): string | null {
  const [resolvedMedia, setResolvedMedia] = useState<ResolvedMedia | null>(
    null,
  );

  useEffect(() => {
    if (!relativePath) return;

    let active = true;

    void window.api.file
      .getMediaUrl(relativePath)
      .then((url) => {
        if (active) setResolvedMedia({ path: relativePath, url });
      })
      .catch(() => {
        if (active) setResolvedMedia(null);
      });

    return () => {
      active = false;
    };
  }, [relativePath]);

  return resolvedMedia?.path === relativePath ? resolvedMedia.url : null;
}
