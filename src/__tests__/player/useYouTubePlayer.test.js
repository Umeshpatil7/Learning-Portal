import React, { useEffect } from 'react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, waitFor, act } from '@testing-library/react';
import useYouTubePlayer from '../../hooks/useYouTubePlayer';

// Helper test component to render a div and bind the ref on mount
function PlayerTestComponent({ videoId, initialPosition, onPlayerState }) {
  const player = useYouTubePlayer(videoId, initialPosition);

  useEffect(() => {
    onPlayerState(player);
  }, [player.isReady, player.currentTime, player.maxWatchedTime, player.playerState]);

  return <div ref={player.containerRef} />;
}

describe('useYouTubePlayer Scrubber Lock Hook', () => {
  let mockPlayer;

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock YT Player structure
    mockPlayer = {
      seekTo: vi.fn(),
      getCurrentTime: vi.fn(() => 0),
      getDuration: vi.fn(() => 600),
      destroy: vi.fn()
    };

    // Stub YT globals
    window.YT = {
      Player: vi.fn().mockImplementation((container, options) => {
        // Trigger onReady immediately
        if (options.events && options.events.onReady) {
          setTimeout(() => {
            options.events.onReady({ target: mockPlayer });
          }, 0);
        }
        return mockPlayer;
      }),
      PlayerState: {
        PLAYING: 1,
        PAUSED: 2,
        ENDED: 0
      }
    };
  });

  test('initializes player state correctly', async () => {
    let latestState = null;
    
    render(
      <PlayerTestComponent
        videoId="dQw4w9WgXcQ"
        initialPosition={10}
        onPlayerState={(state) => {
          latestState = state;
        }}
      />
    );

    // Wait for the hook to be ready
    await waitFor(() => {
      expect(latestState).toBeDefined();
      expect(latestState.isReady).toBe(true);
    });

    expect(mockPlayer.seekTo).toHaveBeenCalledWith(10, true);
    expect(latestState.maxWatchedTime).toBe(10);
  });

  test('seekTo allows backward seeking', async () => {
    let latestState = null;

    render(
      <PlayerTestComponent
        videoId="dQw4w9WgXcQ"
        initialPosition={150}
        onPlayerState={(state) => {
          latestState = state;
        }}
      />
    );

    await waitFor(() => {
      expect(latestState).toBeDefined();
      expect(latestState.isReady).toBe(true);
    });

    // Perform backward seek to 80
    act(() => {
      latestState.seekTo(80);
    });

    expect(mockPlayer.seekTo).toHaveBeenLastCalledWith(80, true);
  });

  test('seekTo restricts forward seeking exceeding watch boundary', async () => {
    let latestState = null;

    render(
      <PlayerTestComponent
        videoId="dQw4w9WgXcQ"
        initialPosition={50}
        onPlayerState={(state) => {
          latestState = state;
        }}
      />
    );

    await waitFor(() => {
      expect(latestState).toBeDefined();
      expect(latestState.isReady).toBe(true);
    });

    // Attempt to seek forward to 300 (exceeding maxWatchedTime of 50)
    act(() => {
      latestState.seekTo(300);
    });

    expect(mockPlayer.seekTo).toHaveBeenLastCalledWith(50, true);
  });
});
