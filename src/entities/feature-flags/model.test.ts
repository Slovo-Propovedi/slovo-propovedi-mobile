import { createCtx } from '@reatom/framework'
import { featureFlagsApi, secureTokenStorage } from 'shared/api'
import { reportError } from 'shared/model/error-dialog'
import { featureFlagsAtom, fetchMyFeatureFlags } from './model'

jest.mock('shared/api', () => ({
  featureFlagsApi: { getFeatureFlags: jest.fn() },
  secureTokenStorage: { getAccessToken: jest.fn() },
}))

jest.mock('shared/model/error-dialog', () => ({ reportError: jest.fn() }))

const mockedGetAccessToken = secureTokenStorage.getAccessToken as jest.MockedFunction<
  typeof secureTokenStorage.getAccessToken
>
const mockedReportError = reportError as jest.MockedFunction<typeof reportError>
const mockedGetEffectiveForMe = jest.fn()

const setFlagsResponse = (flags: Array<{ enabled: boolean; key: string }>) =>
  mockedGetEffectiveForMe.mockResolvedValue({ flags })

describe('fetchMyFeatureFlags', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(featureFlagsApi.getFeatureFlags as jest.Mock).mockReturnValue({
      featureFlagsControllerGetEffectiveForMe: mockedGetEffectiveForMe,
    })
  })

  test('does not call the API without an access token', async () => {
    mockedGetAccessToken.mockResolvedValue(null)
    const ctx = createCtx()

    await fetchMyFeatureFlags(ctx)

    expect(mockedGetEffectiveForMe).not.toHaveBeenCalled()
    expect(ctx.get(featureFlagsAtom)).toBeNull()
  })

  test('maps the flags list into a record keyed by flag key', async () => {
    mockedGetAccessToken.mockResolvedValue('access-token')
    setFlagsResponse([
      { enabled: true, key: 'read' },
      { enabled: false, key: 'study' },
    ])
    const ctx = createCtx()

    await fetchMyFeatureFlags(ctx)

    expect(ctx.get(featureFlagsAtom)).toEqual({ read: true, study: false })
  })

  test('keeps flags null and reports the error when the request fails', async () => {
    mockedGetAccessToken.mockResolvedValue('access-token')
    const error = new Error('network down')
    mockedGetEffectiveForMe.mockRejectedValue(error)
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    const ctx = createCtx()

    await fetchMyFeatureFlags(ctx)

    expect(ctx.get(featureFlagsAtom)).toBeNull()
    expect(mockedReportError).toHaveBeenCalledWith(error, expect.any(String))
    consoleErrorSpy.mockRestore()
  })
})
