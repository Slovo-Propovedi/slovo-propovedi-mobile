import AsyncStorage from '@react-native-async-storage/async-storage'
import { type UserResponse } from './generated/api.schemas'
import {
  LEGACY_ACCESS_TOKEN_KEY,
  LEGACY_REFRESH_TOKEN_KEY,
  parseCachedUser,
  SECURE_ACCESS_TOKEN_KEY,
  SECURE_REFRESH_TOKEN_KEY,
  SECURE_USER_KEY,
  toValidToken,
} from './secureTokenStorageShared'

// Generic fallback: used by tooling/type-checking and any non-web, non-native
// runtime, so tokens go through AsyncStorage. Web resolves
// `secureTokenStorage.web.ts` (WebCrypto + IndexedDB), native resolves
// `secureTokenStorage.native.ts` (expo-secure-store).
const readWithLegacyMigration = async (secureKey: string, legacyKey: string) => {
  const stored = toValidToken(await AsyncStorage.getItem(secureKey))
  if (stored) return stored

  const legacy = toValidToken(await AsyncStorage.getItem(legacyKey))
  if (!legacy) return null

  await AsyncStorage.setItem(secureKey, legacy)
  await AsyncStorage.removeItem(legacyKey)

  return legacy
}

export const secureTokenStorage = {
  clearCachedUser: async () => {
    await AsyncStorage.removeItem(SECURE_USER_KEY)
  },

  clearTokens: async () => {
    await AsyncStorage.multiRemove([
      SECURE_ACCESS_TOKEN_KEY,
      SECURE_REFRESH_TOKEN_KEY,
      LEGACY_ACCESS_TOKEN_KEY,
      LEGACY_REFRESH_TOKEN_KEY,
    ])
  },

  getAccessToken: async () =>
    readWithLegacyMigration(SECURE_ACCESS_TOKEN_KEY, LEGACY_ACCESS_TOKEN_KEY),

  getCachedUser: async () => parseCachedUser(await AsyncStorage.getItem(SECURE_USER_KEY)),

  getRefreshToken: async () =>
    readWithLegacyMigration(SECURE_REFRESH_TOKEN_KEY, LEGACY_REFRESH_TOKEN_KEY),

  setCachedUser: async (user: UserResponse) => {
    await AsyncStorage.setItem(SECURE_USER_KEY, JSON.stringify(user))
  },

  setTokens: async (accessToken: string, refreshToken: string) => {
    await AsyncStorage.setItem(SECURE_ACCESS_TOKEN_KEY, accessToken)
    await AsyncStorage.setItem(SECURE_REFRESH_TOKEN_KEY, refreshToken)
  },
}
