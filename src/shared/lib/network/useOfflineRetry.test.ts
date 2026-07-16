import { act } from '@testing-library/react-native'
import { AppState } from 'react-native'
import { renderHookWithProviders } from 'shared/mocks/renderWithProviders'
import { isOnlineAtom } from 'shared/model'
import { useOfflineRetry } from './useOfflineRetry'

type Opts = Parameters<typeof useOfflineRetry>[0]
const base: Opts = { fetchFn: jest.fn(), hasCachedData: false, isLoading: false, needsRetry: false }

describe('useOfflineRetry', () => {
  let appStateHandler: (state: string) => void
  let removeSub: jest.Mock

  beforeEach(() => {
    removeSub = jest.fn()
    jest.spyOn(AppState, 'addEventListener').mockImplementation((_e, handler) => {
      appStateHandler = handler as (state: string) => void
      return { remove: removeSub }
    })
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  const render = (opts: Partial<Opts> = {}) =>
    renderHookWithProviders(() => useOfflineRetry({ ...base, ...opts }))

  test('does not call fetchFn when needsRetry is false', async () => {
    const fetchFn = jest.fn()
    await render({ fetchFn })
    await new Promise(resolve => setTimeout(resolve, 100))
    expect(fetchFn).not.toHaveBeenCalled()
  })

  test('does not retry on connectivity restore when isLoading', async () => {
    const fetchFn = jest.fn().mockResolvedValue(undefined)
    const { ctx } = await render({ fetchFn, isLoading: true, needsRetry: true })
    await act(async () => {
      isOnlineAtom(ctx, false)
    })
    await act(async () => {
      isOnlineAtom(ctx, true)
    })
    expect(fetchFn).not.toHaveBeenCalled()
  })

  test('retries immediately when app returns to foreground', async () => {
    const fetchFn = jest.fn().mockResolvedValue(undefined)
    await render({ fetchFn, needsRetry: true })
    await act(async () => {
      appStateHandler('background')
    })
    await act(async () => {
      appStateHandler('active')
    })
    expect(fetchFn).toHaveBeenCalledTimes(1)
  })

  test('cleans up on unmount', async () => {
    const clearIntervalSpy = jest.spyOn(global, 'clearInterval')
    const { unmount } = await render({ needsRetry: true })
    await unmount()
    expect(removeSub).toHaveBeenCalled()
    expect(clearIntervalSpy).toHaveBeenCalled()
    clearIntervalSpy.mockRestore()
  })
})
