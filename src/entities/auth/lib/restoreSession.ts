import { action } from '@reatom/framework'
import { authApi, secureTokenStorage } from 'shared/api'
import { getHttpStatus } from 'shared/lib/error-utils'
import { showToast } from 'shared/model'
import { reportError } from 'shared/model/error-dialog'
import { authStatusAtom, authUserAtom } from '../model'

const UNAUTHORIZED_STATUSES = [401, 403]
const PROFILE_LOAD_ERROR_MESSAGE = 'Не удалось проверить сессию администратора'
const NETWORK_ERROR_MESSAGE = 'Нет соединения: не удалось проверить сессию'

export const restoreSession = action(async ctx => {
  // Idempotent: a resolved ('authenticated'/'unauthenticated') or in-flight
  // ('loading') session must not be re-restored. Repeated calls (e.g. the
  // admin area guard firing while a restore is already running) would flap
  // the status back to 'loading' and force a re-render loop.
  if (ctx.get(authStatusAtom) !== 'idle') return ctx.get(authUserAtom)

  await ctx.schedule(() => {
    authStatusAtom(ctx, 'loading')
  })

  const [accessToken, refreshToken] = await Promise.all([
    secureTokenStorage.getAccessToken(),
    secureTokenStorage.getRefreshToken(),
  ])

  if (!accessToken || !refreshToken) {
    await ctx.schedule(() => {
      authUserAtom(ctx, null)
      authStatusAtom(ctx, 'unauthenticated')
    })

    return null
  }

  // Optimistic fill from cache so the UI has a user while the profile verifies.
  const cachedUser = await secureTokenStorage.getCachedUser()
  if (cachedUser && cachedUser.role !== 'user')
    await ctx.schedule(() => {
      authUserAtom(ctx, cachedUser)
    })

  try {
    const user = await authApi.getAuth().authControllerGetProfile()

    if (user.role === 'user') {
      await secureTokenStorage.clearTokens()
      await secureTokenStorage.clearCachedUser()
      await ctx.schedule(() => {
        authUserAtom(ctx, null)
        authStatusAtom(ctx, 'unauthenticated')
      })

      return null
    }

    await secureTokenStorage.setCachedUser(user)
    await ctx.schedule(() => {
      authUserAtom(ctx, user)
      authStatusAtom(ctx, 'authenticated')
    })

    return user
  } catch (error) {
    // Only an explicit auth rejection (401/403) means the tokens are dead.
    // A transient failure (network, 5xx) must not sign the admin out: keep
    // the tokens so the next launch retries.
    const status = getHttpStatus(error)

    if (status !== undefined && UNAUTHORIZED_STATUSES.includes(status)) {
      await secureTokenStorage.clearTokens()
      await secureTokenStorage.clearCachedUser()
    } else if (status === undefined)
      // No HTTP response: a connection/CORS failure. It is transient and
      // self-explanatory, so a short toast replaces the error dialog.
      showToast(ctx, NETWORK_ERROR_MESSAGE)
    else
      // An unexpected HTTP error keeps the detailed dialog for diagnosis.
      reportError(error, PROFILE_LOAD_ERROR_MESSAGE)

    await ctx.schedule(() => {
      authUserAtom(ctx, null)
      authStatusAtom(ctx, 'unauthenticated')
    })

    return null
  }
}, 'restoreSession')
