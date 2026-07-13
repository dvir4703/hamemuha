import type { Contestant } from '../../../src/types';

export type ContestantRecord = Contestant;
export type CreateContestantInput = Omit<Contestant, 'id'>;
