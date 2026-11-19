import { type ListeningHistory } from '../model/types'
import { getEntrySermon } from './getEntrySermon'
import { readHistory, writeHistory } from './historyStorage'
import { isEntryCompleted } from './isEntryCompleted'
import { clearLiveProgressSnapshot, readLiveProgressSnapshot } from './liveProgressStorage'
import { writeProgressRecords } from './progressStorage'

export const reconcileOnHydration = async (): Promise<ListeningHistory> => {
  const entries = await readHistory()
  const snapshot = await readLiveProgressSnapshot()

  if (!snapshot) return entries

  const index = entries.findIndex(e => getEntrySermon(e)?.id === snapshot.sermonId)
  if (index === -1) {
    // The capped catalog no longer holds this sermon, but the legacy snapshot
    // still carries its progress: move it into the unbounded per-sermon store
    // instead of losing it with the snapshot.
    await writeProgressRecords({
      [snapshot.sermonId]: {
        durationMs: snapshot.durationMs,
        positionMs: snapshot.positionMs,
        updatedAt: Date.now(),
      },
    })
    clearLiveProgressSnapshot()
    return entries
  }

  const entry = entries[index]
  if (isEntryCompleted(entry)) {
    clearLiveProgressSnapshot()
    return entries
  }

  const reconciled = [...entries]
  reconciled[index] = {
    ...entry,
    durationMs: Math.max(entry.durationMs, snapshot.durationMs),
    positionMs: snapshot.positionMs,
  }

  await writeHistory(reconciled)
  clearLiveProgressSnapshot()
  return reconciled
}
