import { useEffect } from 'react';

import { useLiveStore } from '../store/liveStore';
import { CONTESTANT_TIME_DEFAULT } from '../utils/timeLimit';

// The store owns elapsed time and settles it synchronously on game actions.
// This hook only refreshes the display and suspends time for blocking dialogs.
export function useContestantTimer(blocked: boolean) {
  const enabled = useLiveStore(
    (state) => state.quiz?.timing_mode === 'per_contestant',
  );
  const contestantId = useLiveStore((state) => state.currentContestantId);
  const remainingMs = useLiveStore(
    (state) => state.remainingTimeMsByContestant.get(contestantId ?? -1) ?? 0,
  );
  const limit = useLiveStore(
    (state) =>
      state.contestants.find((contestant) => contestant.id === contestantId)
        ?.total_time_limit ?? CONTESTANT_TIME_DEFAULT,
  );
  const expired = useLiveStore((state) =>
    state.timeExpiryByContestant.has(contestantId ?? -1),
  );
  const tick = useLiveStore((state) => state.tickContestantTimer);
  const setBlocked = useLiveStore((state) => state.setContestantTimerBlocked);

  useEffect(() => {
    if (!enabled) return;
    setBlocked(blocked);
    const interval = window.setInterval(tick, 100);
    return () => {
      window.clearInterval(interval);
      setBlocked(true);
    };
  }, [blocked, enabled, setBlocked, tick]);

  return {
    remainingSeconds: enabled ? Math.ceil(remainingMs / 1000) : null,
    progress: Math.min(1, Math.max(0, remainingMs / (limit * 1000))),
    hasExpired: expired,
  };
}
