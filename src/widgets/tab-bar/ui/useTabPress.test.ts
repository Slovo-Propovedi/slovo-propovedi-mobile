import { useFeatureFlag } from 'entities/feature-flags'
import { renderHookWithProviders } from 'shared/mocks/renderWithProviders'
import { showInfo } from 'shared/model/info-dialog'
import { UNAVAILABLE_TAB_MESSAGE, UNAVAILABLE_TAB_TITLE, useTabPress } from './useTabPress'

jest.mock('shared/model/info-dialog', () => ({ showInfo: jest.fn() }))

jest.mock('entities/feature-flags', () => ({ useFeatureFlag: jest.fn() }))

const mockedShowInfo = showInfo as jest.MockedFunction<typeof showInfo>
const mockedUseFeatureFlag = useFeatureFlag as jest.MockedFunction<typeof useFeatureFlag>

const createNavigation = () =>
  ({
    emit: jest.fn(() => ({ defaultPrevented: false })),
    navigate: jest.fn(),
  }) as unknown as Parameters<typeof useTabPress>[0]['navigation']

describe('useTabPress', () => {
  beforeEach(() => {
    mockedShowInfo.mockClear()
    mockedUseFeatureFlag.mockReset()
    mockedUseFeatureFlag.mockReturnValue(false)
  })

  test('shows info dialog for unavailable tab and does not navigate', async () => {
    const navigation = createNavigation()
    const { result } = await renderHookWithProviders(() => useTabPress({ navigation }))

    result.current.handleTabPress({ key: 'read', name: 'read' }, false)

    expect(mockedShowInfo).toHaveBeenCalledWith(UNAVAILABLE_TAB_MESSAGE, UNAVAILABLE_TAB_TITLE)
    expect(navigation.navigate).not.toHaveBeenCalled()
  })

  test('shows info dialog for study tab and does not navigate', async () => {
    const navigation = createNavigation()
    const { result } = await renderHookWithProviders(() => useTabPress({ navigation }))

    result.current.handleTabPress({ key: 'study', name: 'study' }, false)

    expect(mockedShowInfo).toHaveBeenCalledWith(UNAVAILABLE_TAB_MESSAGE, UNAVAILABLE_TAB_TITLE)
    expect(navigation.navigate).not.toHaveBeenCalled()
  })

  test('navigates to read tab when its feature flag is enabled', async () => {
    mockedUseFeatureFlag.mockImplementation(key => key === 'read')
    const navigation = createNavigation()
    const { result } = await renderHookWithProviders(() => useTabPress({ navigation }))

    result.current.handleTabPress({ key: 'read', name: 'read' }, false)

    expect(mockedShowInfo).not.toHaveBeenCalled()
    expect(navigation.navigate).toHaveBeenCalledWith('read')
  })

  test('navigates to study tab when its feature flag is enabled', async () => {
    mockedUseFeatureFlag.mockImplementation(key => key === 'study')
    const navigation = createNavigation()
    const { result } = await renderHookWithProviders(() => useTabPress({ navigation }))

    result.current.handleTabPress({ key: 'study', name: 'study' }, false)

    expect(mockedShowInfo).not.toHaveBeenCalled()
    expect(navigation.navigate).toHaveBeenCalledWith('study')
  })

  test('reports read/study availability from feature flags', async () => {
    mockedUseFeatureFlag.mockImplementation(key => key === 'read')
    const navigation = createNavigation()
    const { result } = await renderHookWithProviders(() => useTabPress({ navigation }))

    expect(result.current.isTabAvailable('read')).toBe(true)
    expect(result.current.isTabAvailable('study')).toBe(false)
    expect(result.current.isTabAvailable('listen')).toBe(true)
  })

  test('does not show info dialog for available tab', async () => {
    const navigation = createNavigation()
    const { result } = await renderHookWithProviders(() => useTabPress({ navigation }))

    result.current.handleTabPress({ key: 'listen', name: 'listen' }, false)

    expect(mockedShowInfo).not.toHaveBeenCalled()
    expect(navigation.navigate).toHaveBeenCalledWith('listen')
  })
})
