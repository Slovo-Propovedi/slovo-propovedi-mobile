import { useCallback, useState } from 'react'
import { usePlayNewSermon } from 'entities/player'
import type BottomSheet from '@gorhom/bottom-sheet'
import type { PlaylistData } from 'shared/model'
import { FINAL_SNAP_INDEX } from './useQueueSheetSnapMetrics'

interface UseSheetLifecycleParams {
  closeOnBack: boolean
  noteScrollScheduled: () => void
  noteSheetIndex: (index: number) => void
  onClose: () => void
  onSheetSettled?: (index: number) => void
  playlist: null | PlaylistData
  scrollToCurrent: () => void
  sheetRef: React.RefObject<BottomSheet | null>
}

// gorhom only has 2 snaps; valid snap indices are 0 and 1.
const VALID_SNAP_INDICES = new Set([FINAL_SNAP_INDEX, FINAL_SNAP_INDEX + 1])

// Orchestrates the sheet's open/close lifecycle: the current snap index, the
// onChange handler (auto-scroll + reveal on the final snap, close-on-back),
// the row-press handler that plays a sermon and closes the sheet, and the
// onAnimate callback that updates sheetIndex early so the footer recomputes
// before/during the snap animation (reduces visible content "slide").
export const useSheetLifecycle = ({
  closeOnBack,
  noteScrollScheduled,
  noteSheetIndex,
  onClose,
  onSheetSettled,
  playlist,
  scrollToCurrent,
  sheetRef,
}: UseSheetLifecycleParams) => {
  const playNewSermon = usePlayNewSermon()
  const [sheetIndex, setSheetIndex] = useState(FINAL_SNAP_INDEX)

  const handlePressItem = useCallback(
    async (index: number) => {
      if (!playlist) return
      const sermon = playlist.sermons[index]
      if (!sermon.audioUrl) return

      await playNewSermon({ playlist, sermon })
      sheetRef.current?.close()
      onClose()
    },
    [playlist, playNewSermon, sheetRef, onClose],
  )

  // Fires at animation START (before onChange) — update sheetIndex early so the
  // footer recomputes before/during the snap animation. Ignore close animations
  // (toIndex < 0) and non-snap indices.
  const handleAnimate = useCallback(
    (_fromIndex: number, toIndex: number) => {
      if (toIndex < 0 || !VALID_SNAP_INDICES.has(toIndex)) return
      noteSheetIndex(toIndex)
      setSheetIndex(toIndex)
      if (toIndex === FINAL_SNAP_INDEX) {
        scrollToCurrent()
        noteScrollScheduled()
      }
    },
    [noteSheetIndex, noteScrollScheduled, scrollToCurrent],
  )

  // gorhom does NOT fire onAnimate for the mount-open animation (it evaluates
  // mount on the UI thread without the onAnimate callback — device-verified).
  // onChange fires reliably on mount-open settle, making it the authoritative
  // settle path for auto-scroll and reveal-ceiling activation.
  const handleSheetChanges = useCallback(
    (index: number) => {
      // Mirror to cover any index the animation path missed (e.g., if onAnimate
      // didn't fire for this index).
      if (index >= 0) {
        noteSheetIndex(index)
        setSheetIndex(index)
      }
      // Reliable settle path: onAnimate does not fire for mount-open, so the
      // final-snap calls here guarantee scrollToCurrent runs on first open.
      if (index === FINAL_SNAP_INDEX) {
        scrollToCurrent()
        noteScrollScheduled()
      }
      if (closeOnBack && index === -1) onClose()
      if (index >= 0) onSheetSettled?.(index)
    },
    [closeOnBack, noteSheetIndex, onClose, onSheetSettled, noteScrollScheduled, scrollToCurrent],
  )

  return { handleAnimate, handlePressItem, handleSheetChanges, sheetIndex }
}
