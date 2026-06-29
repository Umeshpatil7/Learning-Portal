import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * Custom React hook to wrap the YouTube IFrame Player API.
 * Enforces seek-forward locking (scrubber lock) to verify users watch the material.
 * 
 * @param {string} videoId - YouTube Video ID (e.g. 'dQw4w9WgXcQ')
 * @param {number} initialPosition - Saved seconds to start playback from
 * @returns {Object} Player controls, states, and ref
 */
export function useYouTubePlayer(videoId, initialPosition = 0) {
  const containerRef = useRef(null);
  const playerRef = useRef(null);
  const timerRef = useRef(null);
  
  const [isReady, setIsReady] = useState(false);
  const [playerState, setPlayerState] = useState(-1); // -1: unstarted, 0: ended, 1: playing, 2: paused, 3: buffering
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  
  // Track furthest watched point using a Ref (to prevent render loops on 250ms updates)
  // and sync it to a state variable for UI consumption.
  const maxWatchedRef = useRef(initialPosition);
  const [maxWatchedTime, setMaxWatchedTime] = useState(initialPosition);

  // Initialize YT script if not present
  useEffect(() => {
    if (window.YT) return;
    
    // Check if script tag already exists in index.html
    const existing = document.querySelector('script[src="https://www.youtube.com/iframe_api"]');
    if (existing) return;

    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
  }, []);

  // Store initialPosition in a ref to avoid re-initializing player when progress updates in sheets
  const startPositionRef = useRef(initialPosition);
  useEffect(() => {
    startPositionRef.current = initialPosition;
  }, [videoId]);

  // Initialize Player when script is ready and video changes
  useEffect(() => {
    if (!videoId) return;

    setIsReady(false);
    setPlayerState(-1);
    
    // Reset watch tracking boundary for a new video
    maxWatchedRef.current = startPositionRef.current;
    setMaxWatchedTime(startPositionRef.current);

    let checkYTApiInterval;

    const createPlayer = () => {
      // If player already exists, destroy it before re-creating
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch (e) {
          console.warn('Error destroying player:', e);
        }
      }

      if (!containerRef.current) return;

      playerRef.current = new window.YT.Player(containerRef.current, {
        videoId: videoId,
        playerVars: {
          autoplay: 0,
          controls: 1, // Standard controls
          modestbranding: 1,
          rel: 0,
          fs: 1, // Fullscreen button
          playsinline: 1, // Inline play in mobile
        },
        events: {
          onReady: (event) => {
            setIsReady(true);
            setDuration(event.target.getDuration());
            if (startPositionRef.current > 0) {
              event.target.seekTo(startPositionRef.current, true);
            }
          },
          onStateChange: (event) => {
            setPlayerState(event.data);
            if (event.data === window.YT.PlayerState.PLAYING) {
              setDuration(event.target.getDuration());
            }
          }
        }
      });
    };

    // If script is already loaded and YT exists, create player
    if (window.YT && window.YT.Player) {
      createPlayer();
    } else {
      // Poll until YT is loaded in window
      checkYTApiInterval = setInterval(() => {
        if (window.YT && window.YT.Player) {
          createPlayer();
          clearInterval(checkYTApiInterval);
        }
      }, 100);
    }

    return () => {
      if (checkYTApiInterval) clearInterval(checkYTApiInterval);
    };
  }, [videoId]);

  // Periodic Scrubber Check & Progress Watcher (250ms Polling when PLAYING)
  useEffect(() => {
    if (playerState !== 1) { // 1 = window.YT.PlayerState.PLAYING
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    timerRef.current = setInterval(() => {
      const player = playerRef.current;
      if (!player || typeof player.getCurrentTime !== 'function') return;

      const time = player.getCurrentTime();
      setCurrentTime(time);

      // Scrubber Seek-Forward locking logic:
      // If user skipped forward past their furthest watched boundary (+2s buffer for minor gaps)
      if (time > maxWatchedRef.current + 2.5) {
        player.seekTo(maxWatchedRef.current, true);
        setCurrentTime(maxWatchedRef.current);
      } else if (time > maxWatchedRef.current) {
        // Naturally playing forward, increase the furthest boundary
        maxWatchedRef.current = time;
        setMaxWatchedTime(time);
      }
    }, 250);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [playerState]);

  // Playback Control helpers
  const play = useCallback(() => {
    if (playerRef.current && isReady) {
      playerRef.current.playVideo();
    }
  }, [isReady]);

  const pause = useCallback(() => {
    if (playerRef.current && isReady) {
      playerRef.current.pauseVideo();
    }
  }, [isReady]);

  const seekTo = useCallback((seconds, allowForward = false) => {
    const player = playerRef.current;
    if (!player || !isReady) return;

    if (allowForward) {
      // Force seek to any position (e.g. during resume setup or admin override)
      maxWatchedRef.current = seconds;
      setMaxWatchedTime(seconds);
      player.seekTo(seconds, true);
    } else {
      // Standard seeking: lock seeks that exceed furthest watch boundary
      if (seconds > maxWatchedRef.current) {
        player.seekTo(maxWatchedRef.current, true);
      } else {
        player.seekTo(seconds, true);
      }
    }
    setCurrentTime(player.getCurrentTime());
  }, [isReady]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch (e) {
          // Ignore destroy errors on unmount
        }
      }
    };
  }, []);

  return {
    containerRef,
    isReady,
    playerState,
    currentTime,
    duration,
    maxWatchedTime,
    play,
    pause,
    seekTo
  };
}

export default useYouTubePlayer;
