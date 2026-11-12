import { useCtx } from '@reatom/npm-react'
import { useCallback } from 'react'
import { typeSearchInput } from 'features/sermon-search'
import { addSearchEntryAction, removeSearchEntryAction } from 'entities/search-history'
import { type SermonData, toAudioPlayerData } from 'entities/sermon'
import { type SearchGroup } from './searchGroup'

interface SearchResultActionsParams {
  onSermonPress: (sermon: SermonData) => void
  setGroup: (group: SearchGroup) => void
}

/**
 * Search-page row actions: a sermon tap is recorded in the local search history
 * before playback, a menu action drops it from that history, and a preacher tap
 * re-runs the search for the artist.
 * @param root0 - Hook input.
 * @param root0.onSermonPress - Page-owned playback handler.
 * @param root0.setGroup - Local results-group setter.
 */
export const useSearchResultActions = ({ onSermonPress, setGroup }: SearchResultActionsParams) => {
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
      setGroup('sermons')
      typeSearchInput(ctx, artist)
    },
    [ctx, setGroup],
  )

  return { handlePreacherPress, handleRemoveFromSearchHistory, handleSermonPress }
}
