import { renderHookWithProviders } from 'shared/mocks/renderWithProviders'
import { showInfo } from 'shared/model/info-dialog'
import { UNAVAILABLE_TAB_MESSAGE, UNAVAILABLE_TAB_TITLE, useTabPress } from './useTabPress'

jest.mock('shared/model/info-dialog', () => ({ showInfo: jest.fn() }))

const mockedShowInfo = showInfo as jest.MockedFunction<typeof showInfo>

const createNavigation = () =>
  ({
    emit: jest.fn(() => ({ defaultPrevented: false })),
    navigate: jest.fn(),
  }) as unknown as Parameters<typeof useTabPress>[0]['navigation']

describe('useTabPress', () => {
  beforeEach(() => {
    mockedShowInfo.mockClear()
  })

  test('shows info dialog for unavailable tab and does not navigate', async () => {
    const navigation = createNavigation()
    const setCurrentIndex = jest.fn()
    const { result } = await renderHookWithProviders(() =>
      useTabPress({ navigation, setCurrentIndex }),
    )

    result.current.handleTabPress({ key: 'read', name: 'read' }, 1, false)

    expect(mockedShowInfo).toHaveBeenCalledWith(UNAVAILABLE_TAB_MESSAGE, UNAVAILABLE_TAB_TITLE)
    expect(navigation.navigate).not.toHaveBeenCalled()
    expect(setCurrentIndex).not.toHaveBeenCalled()
  })

  test('shows info dialog for study tab and does not navigate', async () => {
    const navigation = createNavigation()
    const setCurrentIndex = jest.fn()
    const { result } = await renderHookWithProviders(() =>
      useTabPress({ navigation, setCurrentIndex }),
    )

    result.current.handleTabPress({ key: 'study', name: 'study' }, 2, false)

    expect(mockedShowInfo).toHaveBeenCalledWith(UNAVAILABLE_TAB_MESSAGE, UNAVAILABLE_TAB_TITLE)
    expect(navigation.navigate).not.toHaveBeenCalled()
    expect(setCurrentIndex).not.toHaveBeenCalled()
  })

  test('does not show info dialog for available tab', async () => {
    const navigation = createNavigation()
    const setCurrentIndex = jest.fn()
    const { result } = await renderHookWithProviders(() =>
      useTabPress({ navigation, setCurrentIndex }),
    )

    result.current.handleTabPress({ key: 'listen', name: 'listen' }, 0, false)

    expect(mockedShowInfo).not.toHaveBeenCalled()
    expect(navigation.navigate).toHaveBeenCalledWith('listen')
    expect(setCurrentIndex).toHaveBeenCalledWith(0)
  })
})
