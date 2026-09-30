import { createCtx } from '@reatom/framework'
import { authMocks } from 'shared/api/generated'
import { authStatusAtom, authUserAtom } from '../model'
import { restoreSession } from './restoreSession'

const mockGetProfile = jest.fn()
const mockGetAccessToken = jest.fn()
const mockGetRefreshToken = jest.fn()
const mockGetCachedUser = jest.fn()
const mockSetCachedUser = jest.fn()
const mockClearTokens = jest.fn()
const mockClearCachedUser = jest.fn()
const mockReportError = jest.fn()

jest.mock('shared/api', () => ({
  authApi: {
    getAuth: () => ({ authControllerGetProfile: mockGetProfile }),
  },
  secureTokenStorage: {
    clearCachedUser: () => mockClearCachedUser(),
    clearTokens: () => mockClearTokens(),
    getAccessToken: () => mockGetAccessToken(),
    getCachedUser: () => mockGetCachedUser(),
    getRefreshToken: () => mockGetRefreshToken(),
    setCachedUser: (user: unknown) => mockSetCachedUser(user),
  },
}))

jest.mock('shared/model/error-dialog', () => ({
  reportError: (error: unknown, message?: string) => mockReportError(error, message),
}))

const ADMIN_USER = () => authMocks.getAuthControllerGetProfileResponseMock({ role: 'admin' })

const axiosError = (status: number) => ({ response: { status } })
const networkError = () => new Error('Network Error')

const runRestore = async () => {
  const ctx = createCtx()
  const result = await restoreSession(ctx)

  return { ctx, result }
}

describe('restoreSession', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetAccessToken.mockResolvedValue('access')
    mockGetRefreshToken.mockResolvedValue('refresh')
    mockGetCachedUser.mockResolvedValue(null)
  })

  test('signs out without a fresh profile when the server answers 401', async () => {
    mockGetProfile.mockRejectedValue(axiosError(401))

    const { ctx } = await runRestore()

    expect(mockClearTokens).toHaveBeenCalledTimes(1)
    expect(mockClearCachedUser).toHaveBeenCalledTimes(1)
    expect(mockReportError).not.toHaveBeenCalled()
    expect(ctx.get(authUserAtom)).toBeNull()
    expect(ctx.get(authStatusAtom)).toBe('unauthenticated')
  })

  test('signs out without a fresh profile when the server answers 403', async () => {
    mockGetProfile.mockRejectedValue(axiosError(403))

    await runRestore()

    expect(mockClearTokens).toHaveBeenCalledTimes(1)
    expect(mockClearCachedUser).toHaveBeenCalledTimes(1)
    expect(mockReportError).not.toHaveBeenCalled()
  })

  test('keeps the tokens and reports the error on a network failure', async () => {
    mockGetProfile.mockRejectedValue(networkError())

    await runRestore()

    expect(mockClearTokens).not.toHaveBeenCalled()
    expect(mockClearCachedUser).not.toHaveBeenCalled()
    expect(mockReportError).toHaveBeenCalledTimes(1)
  })

  test('keeps the tokens and reports the error on a 5xx response', async () => {
    mockGetProfile.mockRejectedValue(axiosError(503))

    await runRestore()

    expect(mockClearTokens).not.toHaveBeenCalled()
    expect(mockClearCachedUser).not.toHaveBeenCalled()
    expect(mockReportError).toHaveBeenCalledTimes(1)
  })

  test('authenticates and caches the profile for an admin user', async () => {
    const user = ADMIN_USER()
    mockGetProfile.mockResolvedValue(user)

    const { ctx, result } = await runRestore()

    expect(result).toEqual(user)
    expect(mockSetCachedUser).toHaveBeenCalledWith(user)
    expect(ctx.get(authUserAtom)).toEqual(user)
    expect(ctx.get(authStatusAtom)).toBe('authenticated')
  })

  test('drops tokens for a plain user profile', async () => {
    mockGetProfile.mockResolvedValue(
      authMocks.getAuthControllerGetProfileResponseMock({ role: 'user' }),
    )

    const { ctx, result } = await runRestore()

    expect(result).toBeNull()
    expect(mockClearTokens).toHaveBeenCalledTimes(1)
    expect(ctx.get(authStatusAtom)).toBe('unauthenticated')
  })

  test('treats missing tokens as unauthenticated without clearing', async () => {
    mockGetAccessToken.mockResolvedValue(null)

    const { ctx, result } = await runRestore()

    expect(result).toBeNull()
    expect(mockClearTokens).not.toHaveBeenCalled()
    expect(mockGetProfile).not.toHaveBeenCalled()
    expect(ctx.get(authStatusAtom)).toBe('unauthenticated')
  })
})
