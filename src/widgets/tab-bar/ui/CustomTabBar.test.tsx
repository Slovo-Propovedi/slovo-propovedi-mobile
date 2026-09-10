import { fireEvent } from '@testing-library/react-native'
import { renderWithProviders } from 'shared/mocks/renderWithProviders'
import { showInfo } from 'shared/model/info-dialog'
import { CustomTabBar } from './CustomTabBar'
import { UNAVAILABLE_TAB_MESSAGE, UNAVAILABLE_TAB_TITLE } from './useTabPress'

jest.mock('expo-router', () => ({
  Color: { android: { dynamic: { primaryContainer: 'mockColor' } } },
}))

jest.mock('expo-blur', () => {
  const { View } = jest.requireActual('react-native')
  return { BlurView: View }
})

jest.mock('./useTabIndicator', () => ({
  useTabIndicator: () => ({
    indicatorOpacity: { setValue: jest.fn(), value: 0 },
    indicatorPosition: { setValue: jest.fn(), value: 0 },
    indicatorWidth: { setValue: jest.fn(), value: 0 },
  }),
}))

jest.mock('shared/model/info-dialog', () => ({ showInfo: jest.fn() }))
const mockedShowInfo = showInfo as jest.MockedFunction<typeof showInfo>

const mockNavigate = jest.fn()
const mockSetCurrentIndex = jest.fn()
const mockSetTabLayout = jest.fn()

const createMockState = (activeIndex: number) => ({
  history: [{ key: 'listen', type: 'route' as const }],
  index: activeIndex,
  key: 'tab-root',
  preloadedRouteKeys: [] as string[],
  routeNames: ['listen', 'read', 'study', 'more'],
  routes: [
    { key: 'listen', name: 'listen', path: '/listen' },
    { key: 'read', name: 'read', path: '/read' },
    { key: 'study', name: 'study', path: '/study' },
    { key: 'more', name: 'more', path: '/more' },
  ],
  stale: false as const,
  type: 'tab' as const,
})

const createMockNavigation = () =>
  ({
    emit: jest.fn(() => ({ defaultPrevented: false })),
    navigate: mockNavigate,
  }) as unknown as Parameters<typeof CustomTabBar>[0]['navigation']

const renderTabBar = async (activeIndex = 0) => {
  const state = createMockState(activeIndex)
  const navigation = createMockNavigation()
  const tabLayouts: Record<string, { width: number; x: number }> = {
    listen: { width: 70, x: 0 },
    more: { width: 70, x: 210 },
    read: { width: 70, x: 70 },
    study: { width: 70, x: 140 },
  }

  return renderWithProviders(
    <CustomTabBar
      state={state}
      descriptors={{}}
      navigation={navigation}
      tabLayouts={tabLayouts}
      currentIndex={activeIndex}
      hideFloatingPlayer={false}
      setTabLayout={mockSetTabLayout}
      setCurrentIndex={mockSetCurrentIndex}
      insets={{ bottom: 0, left: 0, right: 0, top: 0 }}
    />,
  )
}

describe('<CustomTabBar>', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('renders all 4 tab labels', async () => {
    const { getByText } = await renderTabBar()

    expect(getByText('Слушать')).toBeTruthy()
    expect(getByText('Читать')).toBeTruthy()
    expect(getByText('Учиться')).toBeTruthy()
    expect(getByText('Еще')).toBeTruthy()
  })

  test('sets the active index on navigation for allowed tab', async () => {
    const { getByText } = await renderTabBar(0)

    await fireEvent.press(getByText('Еще'))

    expect(mockSetCurrentIndex).toHaveBeenCalledWith(3)
  })

  test('tapping a disabled tab shows info dialog and does not navigate', async () => {
    const { getByText } = await renderTabBar(0)

    await fireEvent.press(getByText('Читать'))

    expect(mockedShowInfo).toHaveBeenCalledWith(UNAVAILABLE_TAB_MESSAGE, UNAVAILABLE_TAB_TITLE)
    expect(mockNavigate).not.toHaveBeenCalled()
    expect(mockSetCurrentIndex).not.toHaveBeenCalled()
  })

  test('tapping study (disabled) tab shows info dialog and does not navigate', async () => {
    const { getByText } = await renderTabBar(0)

    await fireEvent.press(getByText('Учиться'))

    expect(mockedShowInfo).toHaveBeenCalledWith(UNAVAILABLE_TAB_MESSAGE, UNAVAILABLE_TAB_TITLE)
    expect(mockNavigate).not.toHaveBeenCalled()
  })

  test('tapping an allowed inactive tab navigates to that route', async () => {
    const { getByText } = await renderTabBar(0)

    await fireEvent.press(getByText('Еще'))

    expect(mockNavigate).toHaveBeenCalledWith('more')
  })

  test('does not show info dialog when tapping an active allowed tab', async () => {
    const { getByText } = await renderTabBar(3)

    await fireEvent.press(getByText('Еще'))

    expect(mockedShowInfo).not.toHaveBeenCalled()
    expect(mockNavigate).not.toHaveBeenCalled()
  })

  test('renders the disabled tab button with reduced opacity', async () => {
    const { getByText } = await renderTabBar(0)

    const readButton = getByText('Читать')
    // Disabled tabs should have a TouchableOpacity ancestor with disabledTabButton style
    const touchable = readButton.parent?.parent
    expect(touchable).toHaveStyle({ opacity: 0.5 })
  })
})
