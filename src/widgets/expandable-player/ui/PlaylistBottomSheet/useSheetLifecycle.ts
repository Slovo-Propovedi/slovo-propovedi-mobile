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
  playlist: null | PlaylistData
  scrollToCurrent: () => void
  sheetRef: React.RefObject<BottomSheet | null>
}

// Orchestrates the sheet's open/close lifecycle: the current snap index, the
// onChange handler (auto-scroll + reveal on the final snap, close-on-back),
// and the row-press handler that plays a sermon and closes the sheet.
export const useSheetLifecycle = ({
  closeOnBack,
  noteScrollScheduled,
  noteSheetIndex,
  onClose,
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

  const handleSheetChanges = useCallback(
    (index: number) => {
      noteSheetIndex(index)
      setSheetIndex(index)
      if (index === FINAL_SNAP_INDEX) {
        scrollToCurrent()
        noteScrollScheduled()
      }
      if (closeOnBack && index === -1) onClose()
    },
    [closeOnBack, noteSheetIndex, noteScrollScheduled, onClose, scrollToCurrent, setSheetIndex],
  )

  return { handlePressItem, handleSheetChanges, sheetIndex }
}
