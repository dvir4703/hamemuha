import type { ContestantResult, GameResult } from '../../../src/types';

export type GameResultRecord = GameResult;
export type ContestantResultRecord = ContestantResult;
export type CreateGameResultInput = Omit<GameResult, 'id' | 'played_at'>;
export type CreateContestantResultInput = Omit<ContestantResult, 'id'>;
