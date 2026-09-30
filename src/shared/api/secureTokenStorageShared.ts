import z from 'zod'
import { type UserResponse } from './generated/api.schemas'

// SecureStore keys may only contain [A-Za-z0-9._-], so the legacy AsyncStorage
// keys (`@access_token`/`@refresh_token`) cannot be reused verbatim. They are
// kept only for the one-time migration performed on first read.
export const LEGACY_ACCESS_TOKEN_KEY = '@access_token'
export const LEGACY_REFRESH_TOKEN_KEY = '@refresh_token'

export const SECURE_ACCESS_TOKEN_KEY = 'slovo_access_token'
export const SECURE_REFRESH_TOKEN_KEY = 'slovo_refresh_token'
export const SECURE_USER_KEY = 'slovo_auth_user'

// Android maps `keychainService` to a scoped SharedPreferences file; keep it
// stable so write/read/delete address the same entry.
export const SECURE_STORE_SERVICE = 'ru.slovopropovedi.auth'

// Tokens read back from disk are untrusted legacy input — reject blanks.
export const toValidToken = (value: null | string): null | string => {
  if (typeof value !== 'string') return null

  const trimmed = value.trim()

  return trimmed.length > 0 ? trimmed : null
}

const cachedUserSchema = z.object({
  email: z.string(),
  id: z.string(),
  name: z.string(),
  role: z.enum(['admin', 'moderator', 'user']),
  username: z.string(),
})

// Parses the cached profile defensively; malformed data is treated as missing.
export const parseCachedUser = (raw: null | string): null | UserResponse => {
  if (!raw) return null

  let value: unknown

  try {
    value = JSON.parse(raw)
  } catch {
    return null
  }

  const parsed = cachedUserSchema.safeParse(value)

  return parsed.success ? parsed.data : null
}
