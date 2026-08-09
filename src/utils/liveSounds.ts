import { Howl } from 'howler';

import backgroundMusicUrl from '../assets/sounds/background-music.mp3?url';
import hintSoundUrl from '../assets/sounds/hint.mp3?url';
import letterTypeSoundUrl from '../assets/sounds/letter-type.mp3?url';
import timerCountdownUrl from '../assets/sounds/timer-countdown.mp3?url';

const LETTER_SOUND_SPRITE_MS = 260;
const LETTER_SOUND_MAX_POLYPHONY = 4;
const BACKGROUND_MUSIC_LOOP_MS = 56_400;
const TIMER_COUNTDOWN_LOOP_MS = 10_000;

export type QuestionLoopSound = 'background' | 'countdown';

const hintSound = new Howl({
  src: [hintSoundUrl],
  volume: 0.62,
  preload: true,
  pool: 1,
});

const activeLetterSoundIds: number[] = [];

function releaseLetterSound(soundId: number) {
  const activeIndex = activeLetterSoundIds.indexOf(soundId);
  if (activeIndex !== -1) activeLetterSoundIds.splice(activeIndex, 1);
}

const letterTypeSound = new Howl({
  src: [letterTypeSoundUrl],
  volume: 0.42,
  preload: true,
  pool: 8,
  sprite: {
    keystroke: [0, LETTER_SOUND_SPRITE_MS],
  },
  onend: releaseLetterSound,
  onstop: releaseLetterSound,
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

export function playLetterTypeSound(): void {
  // Keep a few short Web Audio voices available for fast typing, while capping
  // overlap so repeated keystrokes cannot build into a distorted wall of sound.
  if (activeLetterSoundIds.length >= LETTER_SOUND_MAX_POLYPHONY) {
    const oldestSoundId = activeLetterSoundIds.shift();
    if (oldestSoundId !== undefined) letterTypeSound.stop(oldestSoundId);
  }

  const soundId = letterTypeSound.play('keystroke');
  activeLetterSoundIds.push(soundId);
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
