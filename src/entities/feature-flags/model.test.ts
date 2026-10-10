import { createCtx } from '@reatom/framework'
import { featureFlagsApi } from 'shared/api'
import { featureFlagsMocks } from 'shared/api/generated'
import { showToast } from 'shared/model'
import { reportError } from 'shared/model/error-dialog'
import { featureFlagsAtom, fetchMyFeatureFlags } from './model'

jest.mock('shared/api', () => ({
  featureFlagsApi: { getFeatureFlags: jest.fn() },
}))

jest.mock('shared/model', () => ({ showToast: jest.fn() }))

jest.mock('shared/model/error-dialog', () => ({ reportError: jest.fn() }))

const mockedShowToast = jest.mocked(showToast)
const mockedReportError = jest.mocked(reportError)
const mockedGetEffectiveForMe = jest.fn()

const NETWORK_ERROR = new Error('network down')

const setFlagsResponse = (flags: Array<{ enabled: boolean; key: string }>) =>
  mockedGetEffectiveForMe.mockResolvedValue(
    featureFlagsMocks.getFeatureFlagsControllerGetEffectiveForMeResponseMock({ flags }),
  )

describe('fetchMyFeatureFlags', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(featureFlagsApi.getFeatureFlags as jest.Mock).mockReturnValue({
      featureFlagsControllerGetEffectiveForMe: mockedGetEffectiveForMe,
    })
  })

  test('stores global flags when the server returns them (anonymous)', async () => {
    setFlagsResponse([{ enabled: true, key: 'read' }])
    const ctx = createCtx()

    await fetchMyFeatureFlags(ctx)

    expect(mockedGetEffectiveForMe).toHaveBeenCalledTimes(1)
    expect(mockedShowToast).not.toHaveBeenCalled()
    expect(ctx.get(featureFlagsAtom)).toEqual({ read: true })
  })

  test('stores personalized flags for an authenticated response', async () => {
    setFlagsResponse([
      { enabled: true, key: 'read' },
      { enabled: false, key: 'study' },
    ])
    const ctx = createCtx()

    await fetchMyFeatureFlags(ctx)

    expect(ctx.get(featureFlagsAtom)).toEqual({ read: true, study: false })
  })

  test('keeps flags null and shows a toast instead of the global error on failure', async () => {
    mockedGetEffectiveForMe.mockRejectedValue(NETWORK_ERROR)
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    const ctx = createCtx()

    await fetchMyFeatureFlags(ctx)

    expect(ctx.get(featureFlagsAtom)).toBeNull()
    expect(mockedShowToast).toHaveBeenCalledWith(expect.anything(), expect.any(String))
    expect(mockedReportError).not.toHaveBeenCalled()
    consoleErrorSpy.mockRestore()
  })

  test('does not show a second toast while the failure keeps repeating', async () => {
    mockedGetEffectiveForMe.mockRejectedValue(NETWORK_ERROR)
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    const ctx = createCtx()

    await fetchMyFeatureFlags(ctx)
    await fetchMyFeatureFlags(ctx)

    expect(mockedShowToast).toHaveBeenCalledTimes(1)
    consoleErrorSpy.mockRestore()
  })

  test('shows a toast again when a new failure follows a recovery', async () => {
    mockedGetEffectiveForMe.mockRejectedValue(NETWORK_ERROR)
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    const ctx = createCtx()

    await fetchMyFeatureFlags(ctx)
    setFlagsResponse([{ enabled: true, key: 'read' }])
    await fetchMyFeatureFlags(ctx)
    mockedGetEffectiveForMe.mockRejectedValue(NETWORK_ERROR)
    await fetchMyFeatureFlags(ctx)

    expect(mockedShowToast).toHaveBeenCalledTimes(2)
    consoleErrorSpy.mockRestore()
  })
})
