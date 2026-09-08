import { useCallback, useEffect, useRef, type SyntheticEvent } from 'react';

import introVideoUrl from '../../assets/videos/intro.mp4';

interface IntroVideoScreenProps {
  enabled?: boolean;
  onComplete: () => void;
}

export function IntroVideoScreen({
  enabled = true,
  onComplete,
}: IntroVideoScreenProps) {
  const hasCompletedRef = useRef(false);

  const completeIntro = useCallback(() => {
    if (hasCompletedRef.current) return;
    hasCompletedRef.current = true;
    onComplete();
  }, [onComplete]);

  useEffect(() => {
    if (!enabled) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Enter' || event.repeat) return;
      event.preventDefault();
      completeIntro();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [completeIntro, enabled]);

  const handleVideoError = useCallback(
    (event: SyntheticEvent<HTMLVideoElement>) => {
      console.error(
        'סרטון הפתיחה לא נטען. המשחק ממשיך ישירות לשאלה הראשונה.',
        event.currentTarget.error,
      );
      completeIntro();
    },
    [completeIntro],
  );

  return (
    <main className="live-intro-video" aria-label="סרטון פתיחת החידון">
      <video
        className="live-intro-video__media"
        src={introVideoUrl}
        autoPlay
        playsInline
        preload="auto"
        controls={false}
        controlsList="nodownload noplaybackrate nofullscreen"
        disablePictureInPicture
        onEnded={completeIntro}
        onError={handleVideoError}
      />
    </main>
  );
}
