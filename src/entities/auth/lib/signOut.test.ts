import { createCtx } from '@reatom/framework'
import { authStatusAtom, authUserAtom } from '../model'
import { signOut } from './signOut'

const mockLogout = jest.fn()
const mockGetRefreshToken = jest.fn()
const mockClearTokens = jest.fn()
const mockClearCachedUser = jest.fn()
const mockFetchMyFeatureFlags = jest.fn()

jest.mock('entities/feature-flags/@x/auth', () => ({
  fetchMyFeatureFlags: (...args: unknown[]) => mockFetchMyFeatureFlags(...args),
}))

jest.mock('shared/api', () => ({
  authApi: {
    getAuth: () => ({ authControllerLogout: mockLogout }),
  },
  secureTokenStorage: {
    clearCachedUser: () => mockClearCachedUser(),
    clearTokens: () => mockClearTokens(),
    getRefreshToken: () => mockGetRefreshToken(),
  },
}))

describe('signOut', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // The revocation request races a 3s timeout; fake timers keep the pending
    // timer from leaking between tests.
    jest.useFakeTimers()
    mockGetRefreshToken.mockResolvedValue(null)
  })

  afterEach(() => {
    jest.clearAllTimers()
    jest.useRealTimers()
  })

  test('refetches feature flags after signing out', async () => {
    const ctx = createCtx()

    await signOut(ctx)

    expect(mockClearTokens).toHaveBeenCalledTimes(1)
    expect(mockClearCachedUser).toHaveBeenCalledTimes(1)
    expect(ctx.get(authStatusAtom)).toBe('unauthenticated')
    expect(ctx.get(authUserAtom)).toBeNull()
    expect(mockFetchMyFeatureFlags).toHaveBeenCalledTimes(1)
    expect(mockFetchMyFeatureFlags).toHaveBeenCalledWith(expect.anything())
  })

  test('refetches feature flags after revoking the session', async () => {
    mockGetRefreshToken.mockResolvedValue('refresh')
    mockLogout.mockResolvedValue(undefined)
    const ctx = createCtx()

    await signOut(ctx)

    expect(mockLogout).toHaveBeenCalledWith({ refreshToken: 'refresh' })
    expect(mockFetchMyFeatureFlags).toHaveBeenCalledTimes(1)
  })

  test('refetches feature flags even when revocation fails', async () => {
    mockGetRefreshToken.mockResolvedValue('refresh')
    mockLogout.mockRejectedValue(new Error('network'))
    const ctx = createCtx()

    await signOut(ctx)

    expect(mockClearTokens).toHaveBeenCalledTimes(1)
    expect(mockFetchMyFeatureFlags).toHaveBeenCalledTimes(1)
  })
})
