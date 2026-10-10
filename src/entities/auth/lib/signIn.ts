import { action } from '@reatom/framework'
import { fetchMyFeatureFlags } from 'entities/feature-flags/@x/auth'
import { type APITypes, authApi, secureTokenStorage } from 'shared/api'
import { ADMIN_ACCESS_DENIED_MESSAGE, authStatusAtom, authUserAtom } from '../model'

export const signIn = action(async (ctx, credentials: APITypes.SignInRequestDto) => {
  await ctx.schedule(() => {
    authStatusAtom(ctx, 'loading')
    authUserAtom(ctx, null)
  })

  try {
    const response = await authApi.getAuth().authControllerSignIn(credentials)

    if (response.user.role === 'user') {
      await secureTokenStorage.clearTokens()
      throw new Error(ADMIN_ACCESS_DENIED_MESSAGE)
    }

    await secureTokenStorage.setTokens(response.accessToken, response.refreshToken)
    await secureTokenStorage.setCachedUser(response.user)

    await ctx.schedule(() => {
      authUserAtom(ctx, response.user)
      authStatusAtom(ctx, 'authenticated')
    })

    // The fresh token is now attached by the axios interceptor, so refetch the
    // flags to get the personalized slice instead of waiting for a foreground.
    void fetchMyFeatureFlags(ctx)

    return response.user
  } catch (error) {
    await ctx.schedule(() => {
      authUserAtom(ctx, null)
      authStatusAtom(ctx, 'unauthenticated')
    })

    throw error
  }
}, 'signIn')
