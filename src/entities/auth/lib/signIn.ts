import { action } from '@reatom/framework'
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

    return response.user
  } catch (error) {
    await ctx.schedule(() => {
      authUserAtom(ctx, null)
      authStatusAtom(ctx, 'unauthenticated')
    })

    throw error
  }
}, 'signIn')
