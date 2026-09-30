import { action } from '@reatom/framework'
import { authApi, secureTokenStorage } from 'shared/api'
import { authStatusAtom, authUserAtom } from '../model'

const SIGN_OUT_TIMEOUT_MS = 3000

const withTimeout = <T>(promise: Promise<T>, timeoutMs: number) =>
  Promise.race([
    promise,
    new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error('Logout request timed out'))
      }, timeoutMs)
    }),
  ])

export const signOut = action(async ctx => {
  const refreshToken = await secureTokenStorage.getRefreshToken()

  if (refreshToken)
    try {
      await withTimeout(
        authApi.getAuth().authControllerLogout({ refreshToken }),
        SIGN_OUT_TIMEOUT_MS,
      )
    } catch {
      // Best-effort server revocation — local sign-out must succeed regardless.
    }

  await secureTokenStorage.clearTokens()
  await secureTokenStorage.clearCachedUser()

  await ctx.schedule(() => {
    authUserAtom(ctx, null)
    authStatusAtom(ctx, 'unauthenticated')
  })
}, 'signOut')
