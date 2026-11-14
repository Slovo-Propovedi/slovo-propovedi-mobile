import { useCtx } from '@reatom/npm-react'
import { useCallback } from 'react'
import { addSearchEntryAction, removeSearchEntryAction } from 'entities/search-history'
import { type SermonData, toAudioPlayerData } from 'entities/sermon'

interface SearchResultActionsParams {
  onPreacherPress: (artist: string) => void
  onSermonPress: (sermon: SermonData) => void
}

/**
 * Search-page row actions: a sermon tap is recorded in the local search history
 * before playback, a menu action drops it from that history, and a preacher tap
 * opens the preacher screen owned by the page.
 * @param root0 - Hook input.
 * @param root0.onPreacherPress - Page-owned preacher navigation handler.
 * @param root0.onSermonPress - Page-owned playback handler.
 */
export const useSearchResultActions = ({
  onPreacherPress,
  onSermonPress,
}: SearchResultActionsParams) => {
  const ctx = useCtx()

  const handleSermonPress = useCallback(
    (sermon: SermonData) => {
      const audio = toAudioPlayerData(sermon)
      if (audio) void addSearchEntryAction(ctx, audio)
      onSermonPress(sermon)
    },
    [ctx, onSermonPress],
  )

  const handleRemoveFromSearchHistory = useCallback(
    (sermonId: string) => {
      void removeSearchEntryAction(ctx, sermonId)
    },
    [ctx],
  )

  const handlePreacherPress = useCallback(
    (artist: string) => {
      onPreacherPress(artist)
    },
    [onPreacherPress],
  )

  return { handlePreacherPress, handleRemoveFromSearchHistory, handleSermonPress }
}
