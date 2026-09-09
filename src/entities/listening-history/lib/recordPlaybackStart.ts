import { action } from '@reatom/framework'
import { type AudioPlayerData, type PlaylistData } from 'shared/model'
import { commitHistory } from '../model/commitHistory'
import { historyAtom } from '../model/historyAtom'
import { type ListeningHistory } from '../model/types'
import { buildHistoryEntry } from './buildHistoryEntry'
import { getEntrySermon } from './getEntrySermon'
import { isEntryCompleted } from './isEntryCompleted'
import { clearLiveProgressSnapshot } from './liveProgressStorage'
import { sortAndCapEntries } from './sortAndCapEntries'

export const recordPlaybackStartAction = action(
  async (ctx, audio: AudioPlayerData, playlist: PlaylistData) => {
    const current = ctx.get(historyAtom)
    const sermonId = audio.id
    const now = Date.now()

    const existingIndex = current.findIndex(e => getEntrySermon(e)?.id === sermonId)

    let next: ListeningHistory

    if (existingIndex === -1) {
      const entry = buildHistoryEntry(audio, playlist, now)
      next = sortAndCapEntries([entry, ...current])
    } else {
      const existing = current[existingIndex]
      if (isEntryCompleted(existing)) {
        const entry = buildHistoryEntry(audio, playlist, now)
        const withoutExisting = current.filter((_, i) => i !== existingIndex)
        next = sortAndCapEntries([entry, ...withoutExisting])
      } else {
        const { playlists: _stripped, ...sanitized } = audio
        const mergedSermon = {
          ...getEntrySermon(existing),
          ...sanitized,
        }
        const updated = {
          ...existing,
          lastPlayedAt: now,
          playlist: {
            artwork: playlist.artwork,
            description: playlist.description,
            id: playlist.id,
            sermons: [mergedSermon],
            title: playlist.title,
          },
        }
        const withoutExisting = current.filter((_, i) => i !== existingIndex)
        next = sortAndCapEntries([updated, ...withoutExisting])
      }
    }

    await commitHistory(ctx, next)
    clearLiveProgressSnapshot()
    return next
  },
  'recordPlaybackStart',
)
