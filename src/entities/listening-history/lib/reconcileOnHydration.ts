import { type ListeningHistory } from '../model/types'
import { getEntrySermon } from './getEntrySermon'
import { readHistory, writeHistory } from './historyStorage'
import { isEntryCompleted } from './isEntryCompleted'
import { clearLiveProgressSnapshot, readLiveProgressSnapshot } from './liveProgressStorage'

export const reconcileOnHydration = async (): Promise<ListeningHistory> => {
  const entries = await readHistory()
  const snapshot = await readLiveProgressSnapshot()

  if (!snapshot) return entries

  const index = entries.findIndex(e => getEntrySermon(e).id === snapshot.sermonId)
  if (index === -1) {
    clearLiveProgressSnapshot()
    return entries
  }

  const entry = entries[index]
  if (isEntryCompleted(entry)) return entries

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
