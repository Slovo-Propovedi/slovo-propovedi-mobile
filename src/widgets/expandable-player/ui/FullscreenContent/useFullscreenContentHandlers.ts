import { useCallback } from 'react'

/**
 * Stable callbacks for the fullscreen player, so the memoized sheets skip
 * re-renders on unrelated parent ticks.
 * @param handleCollapse - Collapse cascade for the current session.
 * @param onClose - Collapses the player out of fullscreen.
 * @param setShowPlaylist - Setter that hides the queue sheet.
 * @param setShowSoundSettings - Setter that hides the sound-settings sheet.
 */
export const useFullscreenContentHandlers = (
  handleCollapse: (onClose: () => void) => void,
  onClose: () => void,
  setShowPlaylist: (show: boolean) => void,
  setShowSoundSettings: (show: boolean) => void,
) => ({
  handleClosePlaylist: useCallback(() => setShowPlaylist(false), [setShowPlaylist]),
  handleCloseSoundSettings: useCallback(() => setShowSoundSettings(false), [setShowSoundSettings]),
  handleCollapsePress: useCallback(() => handleCollapse(onClose), [handleCollapse, onClose]),
})
