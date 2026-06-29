import { describe, test, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import useYouTubePlayer from '../../hooks/useYouTubePlayer';

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
    const { result, rerender } = renderHook(() => useYouTubePlayer('dQw4w9WgXcQ', 10));

    expect(result.current.isReady).toBe(false);
    expect(result.current.maxWatchedTime).toBe(10);

    // Populate containerRef and rerender to trigger setup
    result.current.containerRef.current = document.createElement('div');
    rerender();

    // Wait for async YT target hook
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 20));
    });

    expect(result.current.isReady).toBe(true);
    expect(mockPlayer.seekTo).toHaveBeenCalledWith(10, true);
  });

  test('seekTo allows backward seeking', async () => {
    const { result, rerender } = renderHook(() => useYouTubePlayer('dQw4w9WgXcQ', 150));

    result.current.containerRef.current = document.createElement('div');
    rerender();

    // Wait for player ready
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 20));
    });

    // Mock current watched boundary is 150
    act(() => {
      result.current.seekTo(80);
    });

    // Should seek to 80 successfully
    expect(mockPlayer.seekTo).toHaveBeenLastCalledWith(80, true);
  });

  test('seekTo restricts forward seeking exceeding watch boundary', async () => {
    const { result, rerender } = renderHook(() => useYouTubePlayer('dQw4w9WgXcQ', 50));

    result.current.containerRef.current = document.createElement('div');
    rerender();

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 20));
    });

    // Attempt to seek forward to 300, when max watched boundary is 50
    act(() => {
      result.current.seekTo(300);
    });

    // Should snap user back to maxWatchedTime (50)
    expect(mockPlayer.seekTo).toHaveBeenLastCalledWith(50, true);
  });
});
