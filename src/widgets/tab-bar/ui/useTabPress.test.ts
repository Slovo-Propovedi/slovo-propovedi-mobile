import { createCtx } from '@reatom/framework'
import { act, waitFor } from '@testing-library/react-native'
import { isSearchOpenAtom, searchQueryAtom } from 'features/sermon-search'
import { useFeatureFlag } from 'entities/feature-flags'
import { renderHookWithProviders } from 'shared/mocks/renderWithProviders'
import { showInfo } from 'shared/model/info-dialog'
import { isBarCollapsedAtom, setBarCollapsed } from 'shared/ui/layout'
import { UNAVAILABLE_TAB_MESSAGE, UNAVAILABLE_TAB_TITLE, useTabPress } from './useTabPress'

jest.mock('shared/model/info-dialog', () => ({ showInfo: jest.fn() }))

jest.mock('entities/feature-flags', () => ({ useFeatureFlag: jest.fn() }))

jest.mock('expo-audio', () => ({
  createAudioPlayer: jest.fn(),
  setAudioModeAsync: jest.fn(),
}))

const mockedShowInfo = showInfo as jest.MockedFunction<typeof showInfo>
const mockedUseFeatureFlag = useFeatureFlag as jest.MockedFunction<typeof useFeatureFlag>

type UseTabPressParams = Parameters<typeof useTabPress>[0]

const createEmitter = () =>
  ({
    emit: jest.fn(() => ({ defaultPrevented: false })),
  }) as unknown as UseTabPressParams['emitter']

const createNavigateToTab = () => jest.fn() as unknown as UseTabPressParams['navigateToTab']

describe('useTabPress', () => {
  beforeEach(() => {
    mockedShowInfo.mockClear()
    mockedUseFeatureFlag.mockReset()
    mockedUseFeatureFlag.mockReturnValue(false)
  })

  test('shows info dialog for unavailable tab and does not navigate', async () => {
    const emitter = createEmitter()
    const navigateToTab = createNavigateToTab()
    const { result } = await renderHookWithProviders(() => useTabPress({ emitter, navigateToTab }))

    result.current.handleTabPress({ key: 'read', name: 'read' }, false)

    expect(mockedShowInfo).toHaveBeenCalledWith(UNAVAILABLE_TAB_MESSAGE, UNAVAILABLE_TAB_TITLE)
    expect(navigateToTab).not.toHaveBeenCalled()
  })

  test('navigates to read tab when its feature flag is enabled', async () => {
    mockedUseFeatureFlag.mockImplementation(key => key === 'read')
    const emitter = createEmitter()
    const navigateToTab = createNavigateToTab()
    const { result } = await renderHookWithProviders(() => useTabPress({ emitter, navigateToTab }))

    result.current.handleTabPress({ key: 'read', name: 'read' }, false)

    expect(mockedShowInfo).not.toHaveBeenCalled()
    expect(navigateToTab).toHaveBeenCalledWith('read')
  })

  test('reports read availability from the feature flag', async () => {
    mockedUseFeatureFlag.mockImplementation(key => key === 'read')
    const emitter = createEmitter()
    const navigateToTab = createNavigateToTab()
    const { result } = await renderHookWithProviders(() => useTabPress({ emitter, navigateToTab }))

    expect(result.current.isTabAvailable('read')).toBe(true)
    expect(result.current.isTabAvailable('listen')).toBe(true)
  })

  test('does not show info dialog for available tab', async () => {
    const emitter = createEmitter()
    const navigateToTab = createNavigateToTab()
    const { result } = await renderHookWithProviders(() => useTabPress({ emitter, navigateToTab }))

    result.current.handleTabPress({ key: 'listen', name: 'listen' }, false)

    expect(mockedShowInfo).not.toHaveBeenCalled()
    expect(navigateToTab).toHaveBeenCalledWith('listen')
  })

  test('expands the collapsed bar on an active-tab press instead of navigating', async () => {
    const ctx = createCtx()
    setBarCollapsed(ctx, true)
    const emitter = createEmitter()
    const navigateToTab = createNavigateToTab()
    const { result } = await renderHookWithProviders(
      () => useTabPress({ emitter, navigateToTab }),
      {
        ctx,
      },
    )

    await act(async () => {
      result.current.handleTabPress({ key: 'listen', name: 'listen' }, true)
    })

    expect(ctx.get(isBarCollapsedAtom)).toBe(false)
    expect(navigateToTab).not.toHaveBeenCalled()
  })

  test('keeps the expanded bar expanded on an active-tab press', async () => {
    const ctx = createCtx()
    const emitter = createEmitter()
    const navigateToTab = createNavigateToTab()
    const { result } = await renderHookWithProviders(
      () => useTabPress({ emitter, navigateToTab }),
      {
        ctx,
      },
    )

    result.current.handleTabPress({ key: 'listen', name: 'listen' }, true)

    expect(ctx.get(isBarCollapsedAtom)).toBe(false)
    expect(navigateToTab).not.toHaveBeenCalled()
  })

  test('closes an open search when navigating to another tab', async () => {
    const ctx = createCtx()
    isSearchOpenAtom(ctx, true)
    searchQueryAtom(ctx, 'вера')
    const emitter = createEmitter()
    const navigateToTab = createNavigateToTab()
    const { result } = await renderHookWithProviders(
      () => useTabPress({ emitter, navigateToTab }),
      {
        ctx,
      },
    )

    await act(async () => {
      result.current.handleTabPress({ key: 'more', name: 'more' }, false)
    })

    expect(navigateToTab).toHaveBeenCalledWith('more')
    await waitFor(() => expect(ctx.get(isSearchOpenAtom)).toBe(false))
    expect(ctx.get(searchQueryAtom)).toBe('')
  })
})
