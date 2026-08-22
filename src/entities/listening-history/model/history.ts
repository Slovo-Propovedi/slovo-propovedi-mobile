import { action, atom } from '@reatom/framework'
import { type AudioPlayerData } from 'entities/player'
import { type PlaylistData } from 'shared/model'
import { reportError } from 'shared/model/error-dialog'
import { buildHistoryEntry } from '../lib/buildHistoryEntry'
import { flushHistoryProgressAction } from '../lib/flushHistoryProgress'
import { getEntrySermon } from '../lib/getEntrySermon'
import { writeHistory } from '../lib/historyStorage'
import { isEntryCompleted } from '../lib/isEntryCompleted'
import { clearLiveProgressSnapshot } from '../lib/liveProgressStorage'
import { reconcileOnHydration } from '../lib/reconcileOnHydration'
import { sortAndCapEntries } from '../lib/sortAndCapEntries'
import { type ListeningHistory } from './types'

export const historyAtom = atom<ListeningHistory>([], 'historyAtom')

export const loadHistoryAction = action(async ctx => {
  try {
    const sorted = sortAndCapEntries(await reconcileOnHydration())
    await ctx.schedule(() => {
      historyAtom(ctx, sorted)
    })
  } catch (error) {
    console.error('Failed to load listening history:', error)
    reportError(error, 'Не удалось загрузить историю прослушивания')
  }
}, 'loadHistory')

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

    await writeHistory(next)
    await ctx.schedule(() => {
      historyAtom(ctx, next)
    })
    clearLiveProgressSnapshot()
    return next
  },
  'recordPlaybackStart',
)

export const markHistoryCompletedAction = action(async (ctx, sermonId: string) => {
  const current = ctx.get(historyAtom)
  const index = current.findIndex(e => getEntrySermon(e)?.id === sermonId)
  if (index === -1) return

  const entry = current[index]
  if (entry.durationMs === 0) return

  const updated = { ...entry, positionMs: entry.durationMs }
  const next = [...current.slice(0, index), updated, ...current.slice(index + 1)]

  await writeHistory(next)
  await ctx.schedule(() => {
    historyAtom(ctx, next)
  })
}, 'markHistoryCompleted')

export const removeHistoryEntryAction = action(async (ctx, sermonId: string) => {
  const current = ctx.get(historyAtom)
  const next = current.filter(e => getEntrySermon(e)?.id !== sermonId)

  if (next.length === current.length) return

  await writeHistory(next)
  await ctx.schedule(() => {
    historyAtom(ctx, next)
  })
  clearLiveProgressSnapshot()
}, 'removeHistoryEntry')

export const clearHistoryAction = action(async ctx => {
  await writeHistory([])
  await ctx.schedule(() => {
    historyAtom(ctx, [])
  })
  clearLiveProgressSnapshot()
}, 'clearHistory')

/** @deprecated Use flushHistoryProgressAction instead. */
export const updateHistoryProgressAction = flushHistoryProgressAction
