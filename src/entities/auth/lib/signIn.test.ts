import { createCtx } from '@reatom/framework'
import { authMocks } from 'shared/api/generated'
import { authStatusAtom, authUserAtom } from '../model'
import { signIn } from './signIn'

const mockSignIn = jest.fn()
const mockClearTokens = jest.fn()
const mockSetTokens = jest.fn()
const mockSetCachedUser = jest.fn()
const mockFetchMyFeatureFlags = jest.fn()

jest.mock('entities/feature-flags/@x/auth', () => ({
  fetchMyFeatureFlags: (...args: unknown[]) => mockFetchMyFeatureFlags(...args),
}))

jest.mock('shared/api', () => ({
  authApi: {
    getAuth: () => ({ authControllerSignIn: mockSignIn }),
  },
  secureTokenStorage: {
    clearTokens: () => mockClearTokens(),
    setCachedUser: (user: unknown) => mockSetCachedUser(user),
    setTokens: (accessToken: string, refreshToken: string) =>
      mockSetTokens(accessToken, refreshToken),
  },
}))

const CREDENTIALS = { password: 'secret', username: 'admin' }

const authResponse = (role: 'admin' | 'user') => {
  const response = authMocks.getAuthControllerSignInResponseMock()
  response.user.role = role

  return response
}

describe('signIn', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('refetches feature flags after a successful sign-in', async () => {
    const response = authResponse('admin')
    mockSignIn.mockResolvedValue(response)
    const ctx = createCtx()

    await signIn(ctx, CREDENTIALS)

    expect(mockSetTokens).toHaveBeenCalledWith(response.accessToken, response.refreshToken)
    expect(mockSetCachedUser).toHaveBeenCalledWith(response.user)
    expect(ctx.get(authStatusAtom)).toBe('authenticated')
    expect(ctx.get(authUserAtom)).toEqual(response.user)
    expect(mockFetchMyFeatureFlags).toHaveBeenCalledTimes(1)
    expect(mockFetchMyFeatureFlags).toHaveBeenCalledWith(expect.anything())
  })

  test('does not refetch feature flags when a plain user is denied access', async () => {
    mockSignIn.mockResolvedValue(authResponse('user'))
    const ctx = createCtx()

    await expect(signIn(ctx, CREDENTIALS)).rejects.toThrow()

    expect(mockClearTokens).toHaveBeenCalledTimes(1)
    expect(mockFetchMyFeatureFlags).not.toHaveBeenCalled()
  })

  test('does not refetch feature flags when the request fails', async () => {
    mockSignIn.mockRejectedValue(new Error('bad credentials'))
    const ctx = createCtx()

    await expect(signIn(ctx, CREDENTIALS)).rejects.toThrow()

    expect(mockFetchMyFeatureFlags).not.toHaveBeenCalled()
  })
})
