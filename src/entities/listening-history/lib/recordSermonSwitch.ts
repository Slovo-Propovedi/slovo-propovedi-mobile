import { action } from '@reatom/framework'
import { type AudioPlayerData, type PlaylistData } from 'shared/model'
import { historyAtom } from '../model/history'
import { type ListeningHistory, type ListeningHistoryEntry } from '../model/types'
import { buildHistoryEntry } from './buildHistoryEntry'
import { getEntrySermon } from './getEntrySermon'
import { writeHistory } from './historyStorage'
import { isEntryCompleted } from './isEntryCompleted'
import { clearLiveProgressSnapshot } from './liveProgressStorage'
import { sortAndCapEntries } from './sortAndCapEntries'

export const recordSermonSwitchAction = action(
  async (
    ctx,
    params: {
      markOldCompleted: boolean
      newAudio: AudioPlayerData
      newPlaylist: PlaylistData
      oldDurationMs: number
      oldPositionMs: number
      oldSermonId: string
    },
  ) => {
    const current = ctx.get(historyAtom)

    // --- Flush old sermon (read-modify-write in one pass) ---
    const oldIndex = current.findIndex(e => getEntrySermon(e)?.id === params.oldSermonId)
    let flushed: ListeningHistory
    if (oldIndex !== -1 && params.oldPositionMs > 0) {
      const oldEntry = current[oldIndex]
      const finalPosition = params.markOldCompleted ? oldEntry.durationMs : params.oldPositionMs

      const flushedEntry: ListeningHistoryEntry = {
        ...oldEntry,
        positionMs: finalPosition,
      }
      flushed = [...current.slice(0, oldIndex), flushedEntry, ...current.slice(oldIndex + 1)]
    } else flushed = current

    // --- Create/update new sermon entry ---
    const newSermonId = params.newAudio.id
    const existingIndex = flushed.findIndex(e => getEntrySermon(e)?.id === newSermonId)

    let next: ListeningHistory
    if (existingIndex === -1) {
      const entry = buildHistoryEntry(params.newAudio, params.newPlaylist, Date.now())
      next = sortAndCapEntries([entry, ...flushed])
    } else {
      const existing = flushed[existingIndex]
      if (isEntryCompleted(existing)) {
        const entry = buildHistoryEntry(params.newAudio, params.newPlaylist, Date.now())
        const withoutExisting = flushed.filter((_, i) => i !== existingIndex)
        next = sortAndCapEntries([entry, ...withoutExisting])
      } else {
        const { playlists: _stripped, ...sanitized } = params.newAudio
        const mergedSermon = {
          ...getEntrySermon(existing),
          ...sanitized,
        }
        const updated = {
          ...existing,
          lastPlayedAt: Date.now(),
          playlist: {
            artwork: params.newPlaylist.artwork,
            description: params.newPlaylist.description,
            id: params.newPlaylist.id,
            sermons: [mergedSermon],
            title: params.newPlaylist.title,
          },
        }
        const withoutExisting = flushed.filter((_, i) => i !== existingIndex)
        next = sortAndCapEntries([updated, ...withoutExisting])
      }
    }

    await writeHistory(next)
    await ctx.schedule(() => {
      historyAtom(ctx, next)
    })
    clearLiveProgressSnapshot()
  },
  'recordSermonSwitch',
)
