import { Howl } from 'howler';

import backgroundMusicUrl from '../assets/sounds/background-music.mp3?url';
import hintSoundUrl from '../assets/sounds/hint.mp3?url';
import timerCountdownUrl from '../assets/sounds/timer-countdown.mp3?url';

const BACKGROUND_MUSIC_LOOP_MS = 56_400;
const TIMER_COUNTDOWN_LOOP_MS = 10_000;

export type QuestionLoopSound = 'background' | 'countdown';

const hintSound = new Howl({
  src: [hintSoundUrl],
  volume: 0.62,
  preload: true,
  pool: 1,
});

const backgroundMusic = new Howl({
  src: [backgroundMusicUrl],
  volume: 0.2,
  preload: true,
  pool: 1,
  loop: true,
  sprite: {
    questionLoop: [0, BACKGROUND_MUSIC_LOOP_MS, true],
  },
  onloaderror: () => undefined,
  onplayerror: () => undefined,
});

const timerCountdown = new Howl({
  src: [timerCountdownUrl],
  volume: 0.36,
  preload: true,
  pool: 1,
  loop: true,
  sprite: {
    countdownLoop: [0, TIMER_COUNTDOWN_LOOP_MS, true],
  },
  onloaderror: () => undefined,
  onplayerror: () => undefined,
});

export function playHintSound(): void {
  // A quick second reveal restarts the cue instead of stacking two long sounds.
  hintSound.stop();
  hintSound.play();
}

export function stopQuestionLoopSound(): void {
  backgroundMusic.stop();
  timerCountdown.stop();
}

export function playQuestionLoopSound(sound: QuestionLoopSound): void {
  stopQuestionLoopSound();
  if (sound === 'countdown') {
    timerCountdown.play('countdownLoop');
    return;
  }
  backgroundMusic.play('questionLoop');
}
