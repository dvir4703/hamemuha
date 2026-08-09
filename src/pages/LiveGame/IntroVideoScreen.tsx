import { useCallback, useRef, type SyntheticEvent } from 'react';

import introVideoUrl from '../../assets/videos/intro.mp4';

interface IntroVideoScreenProps {
  onComplete: () => void;
}

export function IntroVideoScreen({ onComplete }: IntroVideoScreenProps) {
  const hasCompletedRef = useRef(false);

  const completeIntro = useCallback(() => {
    if (hasCompletedRef.current) return;
    hasCompletedRef.current = true;
    onComplete();
  }, [onComplete]);

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
