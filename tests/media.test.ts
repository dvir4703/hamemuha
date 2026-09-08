import { describe, expect, it } from 'vitest';

import { getQuestionMediaType } from '../src/utils/media';

describe('question media type detection', () => {
  it.each([
    ['images/questions/existing.PNG', 'image'],
    ['media/question-media/video.mp4', 'video'],
    ['media/question-media/audio.MP3', 'audio'],
    [null, null],
    ['media/question-media/unsupported.mov', null],
  ] as const)('maps %s to %s', (path, expected) => {
    expect(getQuestionMediaType(path)).toBe(expected);
  });
});
