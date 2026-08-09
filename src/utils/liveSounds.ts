import { Howl } from 'howler';

import hintSoundUrl from '../assets/sounds/hint.mp3?url';
import letterTypeSoundUrl from '../assets/sounds/letter-type.mp3?url';

const LETTER_SOUND_SPRITE_MS = 260;
const LETTER_SOUND_MAX_POLYPHONY = 4;

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
