import { useCallback } from 'react'
import {
  getEntrySermon,
  type ListeningHistoryEntry,
  resolveEntryPlaylist,
} from 'entities/listening-history'
import { usePlayNewSermon } from 'entities/player'
import { reportError } from 'shared/model/error-dialog'

export const useEntryPlayback = (errorMessage: string) => {
  const playNewSermon = usePlayNewSermon()

  return useCallback(
    async (entry: ListeningHistoryEntry) => {
      const sermon = getEntrySermon(entry)
      if (!sermon) return

      try {
        const playlist = await resolveEntryPlaylist(entry)
        await playNewSermon({ playlist, sermon })
      } catch (error) {
        reportError(error, errorMessage)
      }
    },
    [errorMessage, playNewSermon],
  )
}
