import { type UserResponse } from './generated/api.schemas'
import {
  parseCachedUser,
  SECURE_ACCESS_TOKEN_KEY,
  SECURE_REFRESH_TOKEN_KEY,
  SECURE_USER_KEY,
  toValidToken,
} from './secureTokenStorageShared'
import { readEncryptedValue, removeEncryptedValue, writeEncryptedValue } from './webSecureStore'

// Web storage: AES-GCM over WebCrypto with a non-extractable key in IndexedDB
// (see webSecureStore). Native resolves `secureTokenStorage.native.ts`; this
// file never touches localStorage, so tokens are never stored in plaintext.
const readToken = async (key: string) => toValidToken(await readEncryptedValue(key))

export const secureTokenStorage = {
  clearCachedUser: async () => {
    await removeEncryptedValue(SECURE_USER_KEY)
  },

  clearTokens: async () => {
    await Promise.all([
      removeEncryptedValue(SECURE_ACCESS_TOKEN_KEY),
      removeEncryptedValue(SECURE_REFRESH_TOKEN_KEY),
    ])
  },

  getAccessToken: async () => readToken(SECURE_ACCESS_TOKEN_KEY),

  getCachedUser: async () => parseCachedUser(await readEncryptedValue(SECURE_USER_KEY)),

  getRefreshToken: async () => readToken(SECURE_REFRESH_TOKEN_KEY),

  setCachedUser: async (user: UserResponse) => {
    await writeEncryptedValue(SECURE_USER_KEY, JSON.stringify(user))
  },

  setTokens: async (accessToken: string, refreshToken: string) => {
    await Promise.all([
      writeEncryptedValue(SECURE_ACCESS_TOKEN_KEY, accessToken),
      writeEncryptedValue(SECURE_REFRESH_TOKEN_KEY, refreshToken),
    ])
  },
}
