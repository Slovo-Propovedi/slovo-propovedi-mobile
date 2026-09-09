/* eslint-disable max-lines -- FIXME: refactor  */
import { action, atom } from '@reatom/framework'
import { type AudioPlayerData, type PlaylistData } from 'shared/model'
import { reportError } from 'shared/model/error-dialog'
import { buildHistoryEntry } from '../lib/buildHistoryEntry'
import { getEntrySermon } from '../lib/getEntrySermon'
import { isEntryCompleted } from '../lib/isEntryCompleted'
import { clearLiveProgressSnapshot } from '../lib/liveProgressStorage'
import { reconcileOnHydration } from '../lib/reconcileOnHydration'
import { sortAndCapEntries } from '../lib/sortAndCapEntries'
import { upsertHistoryProgress } from '../lib/upsertHistoryProgress'
import { commitHistory } from './commitHistory'
import { historyAtom } from './historyAtom'
import { type ListeningHistory } from './types'

export const isHistoryLoadedAtom = atom(false, 'isHistoryLoadedAtom')

export const loadHistoryAction = action(async ctx => {
  try {
    const sorted = sortAndCapEntries(await reconcileOnHydration())
    await ctx.schedule(() => {
      historyAtom(ctx, sorted)
    })
  } catch (error) {
    console.error('Failed to load listening history:', error)
    reportError(error, 'Не удалось загрузить историю прослушивания')
  } finally {
    await ctx.schedule(() => {
      isHistoryLoadedAtom(ctx, true)
    })
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

    await commitHistory(ctx, next)
    clearLiveProgressSnapshot()
    return next
  },
  'recordPlaybackStart',
)

// Player-internal completion of an existing entry (no-op without one);
// the user-initiated upsert lives in lib/markSermonListened.ts.
export const markHistoryCompletedAction = action(
  async (ctx, sermonId: string, durationMs?: number) => {
    const current = ctx.get(historyAtom)
    const index = current.findIndex(e => getEntrySermon(e)?.id === sermonId)
    if (index === -1) return

    const entry = current[index]
    const finalDurationMs =
      durationMs !== undefined && durationMs > 0 ? durationMs : entry.durationMs
    if (finalDurationMs === 0) return

    const updated = { ...entry, durationMs: finalDurationMs, positionMs: finalDurationMs }
    const next = [...current.slice(0, index), updated, ...current.slice(index + 1)]

    await commitHistory(ctx, next)
  },
  'markHistoryCompleted',
)

export const removeHistoryEntryAction = action(async (ctx, sermonId: string) => {
  const current = ctx.get(historyAtom)
  const next = current.filter(e => getEntrySermon(e)?.id !== sermonId)

  if (next.length === current.length) return

  await commitHistory(ctx, next)
  clearLiveProgressSnapshot()
}, 'removeHistoryEntry')

export const clearHistoryAction = action(async ctx => {
  await commitHistory(ctx, [])
  clearLiveProgressSnapshot()
}, 'clearHistory')

/**
 * Flushes real playback progress into the history catalog (UPSERT).
 *
 * Immediate flushes (pause, stop, 10s tick, app background) are statements of
 * REAL playback state → always write: create the entry if missing, and update
 * even completed entries (real listening supersedes a manual mark).
 * Deferred flushes (400ms seek-debounce) may be stale — the user can mark the
 * sermon listened during the debounce window — so they alone skip completed
 * entries.
 */
export const flushHistoryProgressAction = action(
  async (
    ctx,
    params: {
      deferred?: boolean
      durationMs: number
      playlist?: PlaylistData
      positionMs: number
      sermon: AudioPlayerData
    },
  ) => {
    if (params.positionMs <= 0) return

    const next = upsertHistoryProgress(ctx.get(historyAtom), params, Date.now())
    if (!next) return

    await commitHistory(ctx, next)
    clearLiveProgressSnapshot()
  },
  'flushHistoryProgress',
)
