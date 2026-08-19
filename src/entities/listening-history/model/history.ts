import { action, atom } from '@reatom/framework'
import { type AudioPlayerData } from 'entities/player'
import { type PlaylistData } from 'shared/model'
import { buildHistoryEntry } from '../lib/buildHistoryEntry'
import { readHistory, writeHistory } from '../lib/historyStorage'
import { isEntryCompleted } from '../lib/isEntryCompleted'
import { sortAndCapEntries } from '../lib/sortAndCapEntries'
import { type ListeningHistory } from './types'

export const historyAtom = atom<ListeningHistory>([], 'historyAtom')

export const loadHistoryAction = action(async ctx => {
  try {
    const entries = await readHistory()
    const sorted = sortAndCapEntries(entries)
    await ctx.schedule(() => {
      historyAtom(ctx, sorted)
    })
  } catch (error) {
    console.error('Failed to load listening history:', error)
  }
}, 'loadHistory')

export const recordPlaybackStartAction = action(
  async (ctx, audio: AudioPlayerData, playlist: PlaylistData) => {
    const current = ctx.get(historyAtom)
    const sermonId = audio.id
    const now = Date.now()

    const existingIndex = current.findIndex(e => e.sermon.id === sermonId)

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
        const mergedSermon = { ...existing.sermon, ...sanitized }
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
          sermon: mergedSermon,
        }
        const withoutExisting = current.filter((_, i) => i !== existingIndex)
        next = sortAndCapEntries([updated, ...withoutExisting])
      }
    }

    await writeHistory(next)
    await ctx.schedule(() => {
      historyAtom(ctx, next)
    })
    return next
  },
  'recordPlaybackStart',
)

export const updateHistoryProgressAction = action(
  async (ctx, params: { durationMs: number; positionMs: number; sermonId: string }) => {
    const current = ctx.get(historyAtom)
    const index = current.findIndex(e => e.sermon.id === params.sermonId)
    if (index === -1) return

    const entry = current[index]
    const updated = {
      ...entry,
      durationMs: params.durationMs > 0 ? params.durationMs : entry.durationMs,
      positionMs: params.positionMs >= 0 ? params.positionMs : entry.positionMs,
    }
    const next = [...current.slice(0, index), updated, ...current.slice(index + 1)]

    await writeHistory(next)
    await ctx.schedule(() => {
      historyAtom(ctx, next)
    })
  },
  'updateHistoryProgress',
)

export const markHistoryCompletedAction = action(async (ctx, sermonId: string) => {
  const current = ctx.get(historyAtom)
  const index = current.findIndex(e => e.sermon.id === sermonId)
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
  const next = current.filter(e => e.sermon.id !== sermonId)

  if (next.length === current.length) return

  await writeHistory(next)
  await ctx.schedule(() => {
    historyAtom(ctx, next)
  })
}, 'removeHistoryEntry')

export const clearHistoryAction = action(async ctx => {
  await writeHistory([])
  await ctx.schedule(() => {
    historyAtom(ctx, [])
  })
}, 'clearHistory')
