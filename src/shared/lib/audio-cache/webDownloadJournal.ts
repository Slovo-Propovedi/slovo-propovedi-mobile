import AsyncStorage from '@react-native-async-storage/async-storage'
import { z } from 'zod'
import { startHeartbeat } from './webDownloadHeartbeat'

export const ACTIVE_DOWNLOADS_KEY = 'audio-cache/active-downloads'

const entrySchema = z.object({
  lastSeenAt: z.number(),
  sessionId: z.string(),
  url: z.string(),
})

const entriesSchema = z.array(entrySchema)

export type ActiveDownloadEntry = z.infer<typeof entrySchema>

const generateSessionId = (): string => {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function')
      return crypto.randomUUID()
  } catch {
    // crypto unavailable in some environments
  }
  return Math.random().toString(36).slice(2)
}

export const sessionId = generateSessionId()

// Serialized read-modify-write queue (pattern like manifestQueue). Every
// journal fn must stay non-throwing: a rejection here surfaces as an unhandled
// rejection → global error modal on web.
let writeQueue: Promise<void> = Promise.resolve()

const enqueueWrite = <T>(fn: () => Promise<T>): Promise<T> => {
  const result = writeQueue.then(fn, fn)
  writeQueue = result.then(() => undefined).catch(() => undefined)
  return result
}

const parseEntries = (raw: string): ActiveDownloadEntry[] => {
  const parsed: unknown = JSON.parse(raw)

  const v2Result = entriesSchema.safeParse(parsed)
  if (v2Result.success) return v2Result.data

  // Legacy v1: string[] → stale entries (never shipped in a release).
  if (Array.isArray(parsed) && parsed.every(item => typeof item === 'string'))
    return parsed.map(url => ({ lastSeenAt: 0, sessionId: 'legacy', url }))

  console.error('[audio-cache] Invalid active-downloads journal, ignoring:', v2Result.error)
  return []
}

// Read active downloads, tolerating legacy/corrupt JSON (logs + empty list).
export const getActiveDownloads = async (): Promise<ActiveDownloadEntry[]> => {
  try {
    const raw = await AsyncStorage.getItem(ACTIVE_DOWNLOADS_KEY)
    return raw ? parseEntries(raw) : []
  } catch (error) {
    console.error('[audio-cache] Invalid active-downloads journal, ignoring:', error)
    return []
  }
}

const writeEntries = async (entries: ActiveDownloadEntry[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(ACTIVE_DOWNLOADS_KEY, JSON.stringify(entries))
  } catch (error) {
    console.error('[audio-cache] Failed to persist active-downloads journal:', error)
  }
}

// Rows are keyed by (sessionId, url): two tabs downloading the SAME url each
// keep their own live row, so one tab's completion or death never reaps the
// other's still-running download.
export const addActiveDownload = async (audioUrl: string): Promise<void> =>
  enqueueWrite(async () => {
    const entries = await getActiveDownloads()
    if (!entries.some(e => e.url === audioUrl && e.sessionId === sessionId)) {
      entries.push({ lastSeenAt: Date.now(), sessionId, url: audioUrl })
      await writeEntries(entries)
    }
  })

export const removeActiveDownload = async (audioUrl: string): Promise<void> =>
  enqueueWrite(async () => {
    const entries = await getActiveDownloads()
    const next = entries.filter(e => !(e.url === audioUrl && e.sessionId === sessionId))
    if (next.length !== entries.length) await writeEntries(next)
  })

export const removeActiveDownloadEntries = async (toRemove: ActiveDownloadEntry[]): Promise<void> =>
  enqueueWrite(async () => {
    const entries = await getActiveDownloads()
    const toRemoveKeys = new Set(toRemove.map(e => `${e.sessionId}:${e.url}`))
    const next = entries.filter(e => !toRemoveKeys.has(`${e.sessionId}:${e.url}`))
    if (next.length !== entries.length) await writeEntries(next)
  })

// Update lastSeenAt for a url, but only if it belongs to the current session.
export const refreshActiveDownload = async (audioUrl: string): Promise<void> =>
  enqueueWrite(async () => {
    const entries = await getActiveDownloads()
    let changed = false
    for (const entry of entries)
      if (entry.url === audioUrl && entry.sessionId === sessionId) {
        entry.lastSeenAt = Date.now()
        changed = true
      }

    if (changed) await writeEntries(entries)
  })

// Add a download to the journal and start a heartbeat; returns a stop function
// to clear the interval (call in finally).
export const addActiveDownloadWithHeartbeat = async (audioUrl: string): Promise<() => void> => {
  await addActiveDownload(audioUrl)
  return startHeartbeat(() => void refreshActiveDownload(audioUrl))
}

export const clearActiveDownloads = async (): Promise<void> =>
  enqueueWrite(async () => {
    try {
      await AsyncStorage.removeItem(ACTIVE_DOWNLOADS_KEY)
    } catch (error) {
      console.error('[audio-cache] Failed to clear active-downloads journal:', error)
    }
  })
