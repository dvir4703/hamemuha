import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

Object.defineProperty(window, 'matchMedia', {
  value: vi.fn(() => ({
    matches: true,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })),
});
vi.mock('../src/utils/liveSounds', () => ({
  playHintSound: vi.fn(),
  playQuestionLoopSound: vi.fn(),
  stopQuestionLoopSound: vi.fn(),
}));
vi.mock('canvas-confetti', () => ({ default: { create: () => vi.fn() } }));
vi.mock('howler', () => ({
  Howl: class {
    play = vi.fn();
    stop = vi.fn();
    unload = vi.fn();
  },
}));
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.clearAllMocks();
});
