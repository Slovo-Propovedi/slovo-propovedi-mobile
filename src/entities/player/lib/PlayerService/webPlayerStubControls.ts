import type { PlaybackStatus } from './types'
import type { WebPlayerStateData } from './webPlayerState'

/**
 * Web fills for PlayerService controls that have no browser counterpart.
 *
 * - Volume: owned by the browser and OS media UI, not settable programmatically.
 * - getStatus: the native player exposes a live status object; on web we derive
 *   the same shape from the web player state.
 *
 * Lock-screen / MediaSession metadata is handled by the class-level
 * MediaSession controller (webMediaSession.ts), not by these stubs.
 * @param getState - Accessor for the current web player state, used by getStatus.
 */
export const createWebStubControls = (getState: () => WebPlayerStateData) => ({
  getStatus: (): PlaybackStatus => {
    const { duration, isPlaying, position } = getState()
    return { duration, isPlaying, position }
  },
  getVolume: (): number => 1,
  setVolume: async (): Promise<void> => {},
})
