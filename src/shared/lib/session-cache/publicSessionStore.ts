import AsyncStorage from '@react-native-async-storage/async-storage'

// Plain storage for public session-cache records (sermons, playlists, …):
// there is nothing to protect, so no encryption cost.
const KEY_PREFIX = 'sessionCache:'

export const readPublicRecord = (name: string): Promise<null | string> =>
  AsyncStorage.getItem(`${KEY_PREFIX}${name}`)

export const writePublicRecord = (name: string, json: string): Promise<void> =>
  AsyncStorage.setItem(`${KEY_PREFIX}${name}`, json)

export const clearPublicRecords = async (): Promise<void> => {
  const keys = await AsyncStorage.getAllKeys()
  const ownKeys = keys.filter(key => key.startsWith(KEY_PREFIX))
  if (ownKeys.length > 0) await AsyncStorage.multiRemove(ownKeys)
}
