import { action } from '@reatom/framework'
import { authApi, secureTokenStorage } from 'shared/api'
import { authStatusAtom, authUserAtom } from '../model'

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
  } catch {
    await secureTokenStorage.clearTokens()
    await secureTokenStorage.clearCachedUser()
    await ctx.schedule(() => {
      authUserAtom(ctx, null)
      authStatusAtom(ctx, 'unauthenticated')
    })

    return null
  }
}, 'restoreSession')
