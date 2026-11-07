import AsyncStorage from '@react-native-async-storage/async-storage'
import * as SecureStore from 'expo-secure-store'
import z from 'zod'
import { getParseJsonWithSchema } from '../../model/getParseJsonWithSchema'
import { clearPublicRecords, readPublicRecord, writePublicRecord } from './publicSessionStore'

// Native: public records go to AsyncStorage; `sensitive` ones (personal data)
// to SecureStore (Android Keystore / iOS Keychain). SecureStore cannot list its
// keys, so the names of written sensitive records are tracked in an index
// (names only — not sensitive) to wipe them all on sign-out.
const SECURE_KEY_PREFIX = 'sessionCache.'
const SENSITIVE_INDEX_KEY = 'sessionCacheSensitiveIndex'

const SECURE_OPTIONS: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  keychainService: 'ru.slovopropovedi.session-cache',
}

const parseIndex = getParseJsonWithSchema(z.array(z.string()))

const readIndex = async (): Promise<string[]> =>
  parseIndex(await AsyncStorage.getItem(SENSITIVE_INDEX_KEY)) ?? []

const addToIndex = async (name: string): Promise<void> => {
  const index = await readIndex()
  if (index.includes(name)) return
  await AsyncStorage.setItem(SENSITIVE_INDEX_KEY, JSON.stringify([...index, name]))
}

const clearSensitiveRecords = async (): Promise<void> => {
  const index = await readIndex()
  await Promise.all(
    index.map(name => SecureStore.deleteItemAsync(`${SECURE_KEY_PREFIX}${name}`, SECURE_OPTIONS)),
  )
  await AsyncStorage.removeItem(SENSITIVE_INDEX_KEY)
}

export const readSessionCacheRecord = (name: string, sensitive: boolean) =>
  sensitive
    ? SecureStore.getItemAsync(`${SECURE_KEY_PREFIX}${name}`, SECURE_OPTIONS)
    : readPublicRecord(name)

export const writeSessionCacheRecord = async (
  name: string,
  json: string,
  sensitive: boolean,
): Promise<void> => {
  if (!sensitive) return writePublicRecord(name, json)

  await addToIndex(name)
  await SecureStore.setItemAsync(`${SECURE_KEY_PREFIX}${name}`, json, SECURE_OPTIONS)
}

export const clearSessionCacheRecords = async (): Promise<void> => {
  await Promise.all([clearSensitiveRecords(), clearPublicRecords()])
}
