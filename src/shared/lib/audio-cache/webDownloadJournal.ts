import AsyncStorage from '@react-native-async-storage/async-storage'
import { z } from 'zod'

export const ACTIVE_DOWNLOADS_KEY = 'audio-cache/active-downloads'

const activeDownloadsSchema = z.array(z.string())

/**
 * Read the set of URLs with an in-flight download, tolerating legacy/corrupt
 * stored JSON (returns an empty list and logs).
 */
export const getActiveDownloads = async (): Promise<string[]> => {
  try {
    const raw = await AsyncStorage.getItem(ACTIVE_DOWNLOADS_KEY)
    if (!raw) return []
    const parsed = activeDownloadsSchema.safeParse(JSON.parse(raw))
    if (!parsed.success) {
      console.error('[audio-cache] Invalid active-downloads journal, ignoring:', parsed.error)
      return []
    }
    return parsed.data
  } catch (error) {
    console.error('[audio-cache] Invalid active-downloads journal, ignoring:', error)
    return []
  }
}

const writeActiveDownloads = async (urls: string[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(ACTIVE_DOWNLOADS_KEY, JSON.stringify(urls))
  } catch (error) {
    console.error('[audio-cache] Failed to persist active-downloads journal:', error)
  }
}

export const addActiveDownload = async (audioUrl: string): Promise<void> => {
  const urls = await getActiveDownloads()
  if (!urls.includes(audioUrl)) urls.push(audioUrl)
  await writeActiveDownloads(urls)
}

export const removeActiveDownload = async (audioUrl: string): Promise<void> => {
  const urls = await getActiveDownloads()
  const next = urls.filter(url => url !== audioUrl)
  if (next.length !== urls.length) await writeActiveDownloads(next)
}

export const clearActiveDownloads = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(ACTIVE_DOWNLOADS_KEY)
  } catch (error) {
    console.error('[audio-cache] Failed to clear active-downloads journal:', error)
  }
}
