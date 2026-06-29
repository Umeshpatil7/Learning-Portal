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
  const moduleIdRef = useRef(moduleId);

  // Sync ref to avoid re-triggering effect on every boundary shift
  useEffect(() => {
    moduleIdRef.current = moduleId;
  }, [moduleId]);

  // Sync handler
  const flushProgress = useEffect(() => {
    const sync = () => {
      const currentModuleId = moduleIdRef.current;
      if (!currentModuleId || duration <= 0) return;

      const watchPercent = Math.min((maxWatchedTime / duration) * 100, 100);
      
      // Prevent redundant syncing of the same second value
      if (Math.abs(maxWatchedTime - lastSyncedTimeRef.current) < 2 && watchPercent < 100) {
        return;
      }

      saveWatchProgress(currentModuleId, watchPercent, maxWatchedTime);
      lastSyncedTimeRef.current = maxWatchedTime;
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
  }, [playerState, maxWatchedTime, duration, saveWatchProgress]);
}

export default useWatchTracker;
