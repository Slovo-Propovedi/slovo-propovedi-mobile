jest.mock('../api/secureTokenStorage', () => ({
  secureTokenStorage: {
    clearCachedUser: jest.fn(),
    clearTokens: jest.fn(),
    getAccessToken: jest.fn(),
    getRefreshToken: jest.fn(),
  },
}))

import { createCtx } from '@reatom/framework'
import { secureTokenStorage } from '../api/secureTokenStorage'
import { resetSessionForServerChange } from './serverUrlSession'
import { sessionExpiredAtom } from './sessionExpiry'

const mockedStorage = jest.mocked(secureTokenStorage)

describe('resetSessionForServerChange', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockedStorage.getAccessToken.mockResolvedValue(null)
    mockedStorage.getRefreshToken.mockResolvedValue(null)
  })

  test('clears tokens and cached user and signals expiry when a session existed', async () => {
    const ctx = createCtx()
    mockedStorage.getRefreshToken.mockResolvedValue('refresh-token')

    await resetSessionForServerChange(ctx)

    expect(mockedStorage.clearTokens).toHaveBeenCalledTimes(1)
    expect(mockedStorage.clearCachedUser).toHaveBeenCalledTimes(1)
    expect(ctx.get(sessionExpiredAtom)).toBe(1)
  })

  test('clears storage without the expiry signal when nobody was signed in', async () => {
    const ctx = createCtx()

    await resetSessionForServerChange(ctx)

    expect(mockedStorage.clearTokens).toHaveBeenCalledTimes(1)
    expect(mockedStorage.clearCachedUser).toHaveBeenCalledTimes(1)
    expect(ctx.get(sessionExpiredAtom)).toBe(0)
  })
})
