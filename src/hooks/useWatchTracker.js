import { useEffect, useRef } from 'react';

/**
 * Custom hook to manage periodic background synchronization of video progress.
 * Syncs watch percentages to Google Sheets every 30 seconds while playing,
 * and handles flush pings on pause/exit.
 * 
 * @param {string} moduleId - Active module ID
 * @param {number} maxWatchedTime - Current furthest watched time in seconds
 * @param {number} duration - Video duration in seconds
 * @param {number} playerState - YouTube player state (1 is playing)
 * @param {Function} saveWatchProgress - ProgressContext save function
 */
export function useWatchTracker(moduleId, maxWatchedTime, duration, playerState, saveWatchProgress) {
  const lastSyncedTimeRef = useRef(0);
  const maxWatchedTimeRef = useRef(maxWatchedTime);
  const durationRef = useRef(duration);
  const moduleIdRef = useRef(moduleId);

  // Sync refs to avoid re-triggering effect on every boundary shift
  useEffect(() => {
    moduleIdRef.current = moduleId;
  }, [moduleId]);

  useEffect(() => {
    maxWatchedTimeRef.current = maxWatchedTime;
  }, [maxWatchedTime]);

  useEffect(() => {
    durationRef.current = duration;
  }, [duration]);

  // Sync handler
  useEffect(() => {
    const sync = () => {
      const currentModuleId = moduleIdRef.current;
      const currentDuration = durationRef.current;
      const currentMaxWatched = maxWatchedTimeRef.current;
      if (!currentModuleId || currentDuration <= 0) return;

      const watchPercent = Math.min((currentMaxWatched / currentDuration) * 100, 100);
      
      // Prevent redundant syncing of the same second value
      if (Math.abs(currentMaxWatched - lastSyncedTimeRef.current) < 2 && watchPercent < 100) {
        return;
      }

      saveWatchProgress(currentModuleId, watchPercent, currentMaxWatched);
      lastSyncedTimeRef.current = currentMaxWatched;
    };

    // 1. Setup 30-second interval sync while PLAYING (state === 1)
    let syncInterval;
    if (playerState === 1) {
      syncInterval = setInterval(sync, 30000);
    }

    // 2. Trigger sync on Pause (state === 2) or Ended (state === 0)
    if (playerState === 2 || playerState === 0) {
      sync();
    }

    return () => {
      if (syncInterval) clearInterval(syncInterval);
      // Flush progress on cleanup (e.g. navigation or page close)
      sync();
    };
  }, [playerState, saveWatchProgress]);
}

export default useWatchTracker;
