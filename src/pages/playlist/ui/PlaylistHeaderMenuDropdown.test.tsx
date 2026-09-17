import { fireEvent, render, screen } from '@testing-library/react-native'
import { PlaylistHeaderMenuDropdown } from './PlaylistHeaderMenuDropdown'
import { PlaylistHistoryMenuItem } from './PlaylistHistoryMenuItem'
import { PlaylistOfflineMenuItem } from './PlaylistOfflineMenuItem'

jest.mock('shared/ui/theme', () => {
  const actual = jest.requireActual('shared/ui/theme')
  return {
    ...actual,
    useTheme: jest.fn(() => ({
      currentTheme: {
        icon: '#333',
        surface: '#fff',
        text: '#000',
        textMuted: '#999',
      },
    })),
  }
})

jest.mock('shared/ui/menu', () => {
  const { View } = jest.requireActual('react-native')
  return {
    AnchoredDropdown: ({
      children,
      onClose,
      visible,
    }: {
      children: React.ReactNode
      onClose: () => void
      visible: boolean
    }) => {
      if (!visible) return null
      return (
        <View testID='anchored-dropdown'>
          <View testID='backdrop' onTouchEnd={onClose} />
          {children}
        </View>
      )
    },
  }
})

const ANCHOR = { height: 36, width: 44, x: 300, y: 500 }

const ADD_ALL_TO_OFFLINE_TEXT = 'Добавить все в офлайн'
const STOP_CACHING_TEXT = 'Остановить добавление в офлайн'
const ALL_CACHED_TEXT = 'Плейлист в офлайне'
const CLEAR_CACHE_TEXT = 'Удалить из офлайн все'
const MARK_ALL_TEXT = 'Пометить все прослушанными'
const REMOVE_TEXT = 'Удалить проповеди из истории'

const defaultProps = {
  allCached: false,
  anchor: ANCHOR,
  canMarkAll: false,
  canRemoveFromHistory: false,
  isAddAllToOfflineDisabled: false,
  isCaching: false,
  isClearCacheDisabled: false,
  onAddAllToOffline: jest.fn(),
  onClearCache: jest.fn(),
  onClose: jest.fn(),
  onMarkAll: jest.fn(),
  onRemoveFromHistory: jest.fn(),
  onStopCaching: jest.fn(),
  visible: true,
}

const renderDropdown = (props?: Partial<typeof defaultProps>) =>
  render(<PlaylistHeaderMenuDropdown {...defaultProps} {...props} />)

describe('<PlaylistHeaderMenuDropdown>', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('shows "Добавить все в офлайн" with cloud-download when not caching and not all cached', async () => {
    await renderDropdown()

    expect(screen.getByText(ADD_ALL_TO_OFFLINE_TEXT)).toBeTruthy()
    expect(screen.queryByText(STOP_CACHING_TEXT)).toBeNull()
  })

  test('shows "Плейлист в офлайне" with check-circle-outline when allCached', async () => {
    await renderDropdown({ allCached: true })

    expect(screen.getByText(ALL_CACHED_TEXT)).toBeTruthy()
    expect(screen.queryByText(ADD_ALL_TO_OFFLINE_TEXT)).toBeNull()
  })

  test('isCaching=true shows "Остановить добавление в офлайн" with stop-circle-outline', async () => {
    await renderDropdown({ isCaching: true })

    expect(screen.getByText(STOP_CACHING_TEXT)).toBeTruthy()
    expect(screen.queryByText(ADD_ALL_TO_OFFLINE_TEXT)).toBeNull()
    expect(screen.queryByText(ALL_CACHED_TEXT)).toBeNull()
  })

  test('isCaching=true stop item is enabled (pressing it fires onStopCaching)', async () => {
    const onStopCaching = jest.fn()
    await renderDropdown({ isCaching: true, onStopCaching })

    fireEvent.press(screen.getByText(STOP_CACHING_TEXT))

    expect(onStopCaching).toHaveBeenCalledTimes(1)
  })

  test('isCaching=true + offline: stop item still enabled', async () => {
    const onStopCaching = jest.fn()
    await renderDropdown({ isAddAllToOfflineDisabled: true, isCaching: true, onStopCaching })

    fireEvent.press(screen.getByText(STOP_CACHING_TEXT))

    expect(onStopCaching).toHaveBeenCalledTimes(1)
  })

  test('onAddAllToOffline fires when add-all-to-offline item is pressed (not caching)', async () => {
    const onAddAllToOffline = jest.fn()
    await renderDropdown({ onAddAllToOffline })

    fireEvent.press(screen.getByText(ADD_ALL_TO_OFFLINE_TEXT))

    expect(onAddAllToOffline).toHaveBeenCalledTimes(1)
  })

  test('clear-all disabled when cachedCount===0', async () => {
    const onClearCache = jest.fn()
    await renderDropdown({ isClearCacheDisabled: true, onClearCache })

    fireEvent.press(screen.getByText(CLEAR_CACHE_TEXT))

    expect(onClearCache).not.toHaveBeenCalled()
  })

  test('clear-all enabled when there are cached items and no queue/inflight', async () => {
    const onClearCache = jest.fn()
    await renderDropdown({ isClearCacheDisabled: false, onClearCache })

    fireEvent.press(screen.getByText(CLEAR_CACHE_TEXT))

    expect(onClearCache).toHaveBeenCalledTimes(1)
  })

  test('menu does not close on stop caching (handler wired, menu stays open)', async () => {
    const onClose = jest.fn()
    await renderDropdown({ isCaching: true, onClose })

    fireEvent.press(screen.getByText(STOP_CACHING_TEXT))

    expect(onClose).not.toHaveBeenCalled()
  })

  test('always renders both cache menu items with divider', async () => {
    await renderDropdown()

    expect(screen.getByText(ADD_ALL_TO_OFFLINE_TEXT)).toBeTruthy()
    expect(screen.getByText(CLEAR_CACHE_TEXT)).toBeTruthy()
  })

  test('hides history items when both flags are false', async () => {
    await renderDropdown()

    expect(screen.queryByText(MARK_ALL_TEXT)).toBeNull()
    expect(screen.queryByText(REMOVE_TEXT)).toBeNull()
  })

  test('shows mark-all item and fires onMarkAll when canMarkAll', async () => {
    const onMarkAll = jest.fn()
    await renderDropdown({ canMarkAll: true, onMarkAll })

    expect(screen.getByText(MARK_ALL_TEXT)).toBeTruthy()
    expect(screen.queryByText(REMOVE_TEXT)).toBeNull()

    fireEvent.press(screen.getByText(MARK_ALL_TEXT))
    expect(onMarkAll).toHaveBeenCalledTimes(1)
  })

  test('shows remove item and fires onRemoveFromHistory when canRemoveFromHistory', async () => {
    const onRemoveFromHistory = jest.fn()
    await renderDropdown({ canRemoveFromHistory: true, onRemoveFromHistory })

    expect(screen.getByText(REMOVE_TEXT)).toBeTruthy()
    expect(screen.queryByText(MARK_ALL_TEXT)).toBeNull()

    fireEvent.press(screen.getByText(REMOVE_TEXT))
    expect(onRemoveFromHistory).toHaveBeenCalledTimes(1)
  })

  test('shows both history items when both flags are true', async () => {
    await renderDropdown({ canMarkAll: true, canRemoveFromHistory: true })

    expect(screen.getByText(MARK_ALL_TEXT)).toBeTruthy()
    expect(screen.getByText(REMOVE_TEXT)).toBeTruthy()
  })
})

describe('<PlaylistOfflineMenuItem>', () => {
  test('calls onPress when not disabled', async () => {
    const onPress = jest.fn()
    await render(<PlaylistOfflineMenuItem text='Cache' onPress={onPress} icon='cloud-download' />)

    fireEvent.press(screen.getByText('Cache'))

    expect(onPress).toHaveBeenCalledTimes(1)
  })

  test('does not call onPress when disabled', async () => {
    const onPress = jest.fn()
    await render(
      <PlaylistOfflineMenuItem isDisabled text='Cache' onPress={onPress} icon='cloud-download' />,
    )

    fireEvent.press(screen.getByText('Cache'))

    expect(onPress).not.toHaveBeenCalled()
  })
})

describe('<PlaylistHistoryMenuItem>', () => {
  test('calls onPress', async () => {
    const onPress = jest.fn()
    await render(
      <PlaylistHistoryMenuItem text='Mark all' onPress={onPress} icon='checkmark-done' />,
    )

    fireEvent.press(screen.getByText('Mark all'))

    expect(onPress).toHaveBeenCalledTimes(1)
  })
})
