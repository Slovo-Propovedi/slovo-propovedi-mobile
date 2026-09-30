import AsyncStorage from '@react-native-async-storage/async-storage'
import * as SecureStore from 'expo-secure-store'
import { type UserResponse } from './generated/api.schemas'
import {
  LEGACY_ACCESS_TOKEN_KEY,
  LEGACY_REFRESH_TOKEN_KEY,
  parseCachedUser,
  SECURE_ACCESS_TOKEN_KEY,
  SECURE_REFRESH_TOKEN_KEY,
  SECURE_STORE_SERVICE,
  SECURE_USER_KEY,
  toValidToken,
} from './secureTokenStorageShared'

const SECURE_STORE_OPTIONS: SecureStore.SecureStoreOptions = {
  keychainService: SECURE_STORE_SERVICE,
}

const readSecure = async (key: string) =>
  toValidToken(await SecureStore.getItemAsync(key, SECURE_STORE_OPTIONS))

// One-time migration: tokens written by older builds live in AsyncStorage under
// the legacy keys. Move the first valid value into SecureStore and drop it there.
const readWithLegacyMigration = async (secureKey: string, legacyKey: string) => {
  const stored = await readSecure(secureKey)
  if (stored) return stored

  const legacy = toValidToken(await AsyncStorage.getItem(legacyKey))
  if (!legacy) return null

  await SecureStore.setItemAsync(secureKey, legacy, SECURE_STORE_OPTIONS)
  await AsyncStorage.removeItem(legacyKey)

  return legacy
}

export const secureTokenStorage = {
  clearCachedUser: async () => {
    await SecureStore.deleteItemAsync(SECURE_USER_KEY, SECURE_STORE_OPTIONS)
  },

  clearTokens: async () => {
    await Promise.all([
      SecureStore.deleteItemAsync(SECURE_ACCESS_TOKEN_KEY, SECURE_STORE_OPTIONS),
      SecureStore.deleteItemAsync(SECURE_REFRESH_TOKEN_KEY, SECURE_STORE_OPTIONS),
      AsyncStorage.multiRemove([LEGACY_ACCESS_TOKEN_KEY, LEGACY_REFRESH_TOKEN_KEY]),
    ])
  },

  getAccessToken: async () =>
    readWithLegacyMigration(SECURE_ACCESS_TOKEN_KEY, LEGACY_ACCESS_TOKEN_KEY),

  getCachedUser: async () =>
    parseCachedUser(await SecureStore.getItemAsync(SECURE_USER_KEY, SECURE_STORE_OPTIONS)),

  getRefreshToken: async () =>
    readWithLegacyMigration(SECURE_REFRESH_TOKEN_KEY, LEGACY_REFRESH_TOKEN_KEY),

  setCachedUser: async (user: UserResponse) => {
    await SecureStore.setItemAsync(SECURE_USER_KEY, JSON.stringify(user), SECURE_STORE_OPTIONS)
  },

  setTokens: async (accessToken: string, refreshToken: string) => {
    await SecureStore.setItemAsync(SECURE_ACCESS_TOKEN_KEY, accessToken, SECURE_STORE_OPTIONS)
    await SecureStore.setItemAsync(SECURE_REFRESH_TOKEN_KEY, refreshToken, SECURE_STORE_OPTIONS)
  },
}
