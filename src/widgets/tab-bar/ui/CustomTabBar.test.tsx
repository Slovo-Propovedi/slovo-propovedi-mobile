import { fireEvent } from '@testing-library/react-native'
import { renderWithProviders } from 'shared/mocks/renderWithProviders'
import { showInfo } from 'shared/model/info-dialog'
import { CustomTabBar } from './CustomTabBar'
import { styles } from './styles'
import { UNAVAILABLE_TAB_MESSAGE, UNAVAILABLE_TAB_TITLE } from './useTabPress'

jest.mock('expo-blur', () => {
  const { View } = jest.requireActual('react-native')
  return { BlurView: View }
})

jest.mock('expo-router', () => ({
  useNavigation: () => ({ addListener: jest.fn(() => jest.fn()) }),
}))

jest.mock('shared/model/info-dialog', () => ({ showInfo: jest.fn() }))
const mockedShowInfo = showInfo as jest.MockedFunction<typeof showInfo>

const mockOpenSearch = jest.fn()
let mockIsSearchOpen = false

jest.mock('features/sermon-search', () => ({
  useIsSearchOpen: () => mockIsSearchOpen,
  useOpenSearch: () => mockOpenSearch,
}))

const mockNavigate = jest.fn()

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

const createMockEmitter = () =>
  ({
    emit: jest.fn(() => ({ defaultPrevented: false })),
  }) as unknown as Parameters<typeof CustomTabBar>[0]['emitter']

const renderTabBar = async (activeIndex = 0, { hideSearch }: { hideSearch?: boolean } = {}) => {
  const state = createMockState(activeIndex)
  const emitter = createMockEmitter()

  return renderWithProviders(
    <CustomTabBar
      state={state}
      descriptors={{}}
      emitter={emitter}
      hideSearch={hideSearch}
      hideFloatingPlayer={false}
      navigateToTab={mockNavigate}
      insets={{ bottom: 0, left: 0, right: 0, top: 0 }}
    />,
  )
}

describe('<CustomTabBar>', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockIsSearchOpen = false
  })

  test('caps the floating island to the 600px content column', async () => {
    await renderTabBar()

    // Literal 600 (not the constant) guards against regressing to the web-only cap,
    // which is `undefined` under the native jest environment.
    expect(styles.floatingIsland.maxWidth).toBe(600)
  })

  test('renders all 4 tab labels', async () => {
    const { getByText } = await renderTabBar()

    expect(getByText('Слушать')).toBeTruthy()
    expect(getByText('Читать')).toBeTruthy()
    expect(getByText('Учиться')).toBeTruthy()
    expect(getByText('Ещё')).toBeTruthy()
  })

  test('marks the active tab with a capsule and primary tint', async () => {
    const { getByText } = await renderTabBar(0)

    expect(getByText('Слушать')).toHaveStyle({ color: '#f16031' })
    expect(getByText('Слушать').parent).toHaveStyle({
      backgroundColor: 'rgba(241, 96, 49, 0.18)',
    })
    expect(getByText('Ещё')).not.toHaveStyle({ color: '#f16031' })
    expect(getByText('Ещё').parent).not.toHaveStyle({
      backgroundColor: 'rgba(241, 96, 49, 0.18)',
    })
  })

  test('renders the circular search button to the right of the island', async () => {
    const { getByRole } = await renderTabBar()

    expect(getByRole('button', { name: 'Поиск' })).toBeTruthy()
  })

  test('hides the search button on the admin tab layout', async () => {
    const { queryByRole } = await renderTabBar(0, { hideSearch: true })

    expect(queryByRole('button', { name: 'Поиск' })).toBeNull()
  })

  test('pressing the search button opens search', async () => {
    const { getByRole } = await renderTabBar()

    await fireEvent.press(getByRole('button', { name: 'Поиск' }))

    expect(mockOpenSearch).toHaveBeenCalledTimes(1)
  })

  test('tapping a disabled tab shows info dialog and does not navigate', async () => {
    const { getByText } = await renderTabBar(0)

    await fireEvent.press(getByText('Читать'))

    expect(mockedShowInfo).toHaveBeenCalledWith(UNAVAILABLE_TAB_MESSAGE, UNAVAILABLE_TAB_TITLE)
    expect(mockNavigate).not.toHaveBeenCalled()
  })

  test('tapping study (disabled) tab shows info dialog and does not navigate', async () => {
    const { getByText } = await renderTabBar(0)

    await fireEvent.press(getByText('Учиться'))

    expect(mockedShowInfo).toHaveBeenCalledWith(UNAVAILABLE_TAB_MESSAGE, UNAVAILABLE_TAB_TITLE)
    expect(mockNavigate).not.toHaveBeenCalled()
  })

  test('tapping an allowed inactive tab navigates to that route', async () => {
    const { getByText } = await renderTabBar(0)

    await fireEvent.press(getByText('Ещё'))

    expect(mockNavigate).toHaveBeenCalledWith('more')
  })

  test('does not show info dialog when tapping an active allowed tab', async () => {
    const { getByText } = await renderTabBar(3)

    await fireEvent.press(getByText('Ещё'))

    expect(mockedShowInfo).not.toHaveBeenCalled()
    expect(mockNavigate).not.toHaveBeenCalled()
  })

  test('renders the disabled tab button with reduced opacity', async () => {
    const { getByText } = await renderTabBar(0)

    const readButton = getByText('Читать')
    // Disabled tabs should have a TouchableButton ancestor with disabledTabButton style
    const touchable = readButton.parent?.parent
    expect(touchable).toHaveStyle({ opacity: 0.5 })
  })
})
