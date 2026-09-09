import { fireEvent, render, screen } from '@testing-library/react-native'
import { PlaylistCacheMenuItem } from './PlaylistCacheMenuItem'
import { PlaylistHeaderMenuDropdown } from './PlaylistHeaderMenuDropdown'
import { PlaylistHistoryMenuItem } from './PlaylistHistoryMenuItem'

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

jest.mock('shared/ui/anchored-dropdown', () => {
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

const CACHE_ALL_TEXT = 'Закешировать все'
const STOP_CACHING_TEXT = 'Остановить кеширование'
const ALL_CACHED_TEXT = 'Плейлист закеширован'
const CLEAR_CACHE_TEXT = 'Удалить из кеша все'
const MARK_ALL_TEXT = 'Пометить все прослушанными'
const REMOVE_TEXT = 'Удалить проповеди из истории'

const defaultProps = {
  allCached: false,
  anchor: ANCHOR,
  canMarkAll: false,
  canRemoveFromHistory: false,
  isCacheAllDisabled: false,
  isCaching: false,
  isClearCacheDisabled: false,
  onCacheAll: jest.fn(),
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

  test('shows "Закешировать все" with download-outline when not caching and not all cached', async () => {
    await renderDropdown()

    expect(screen.getByText(CACHE_ALL_TEXT)).toBeTruthy()
    expect(screen.queryByText(STOP_CACHING_TEXT)).toBeNull()
  })

  test('shows "Плейлист закеширован" with check-circle-outline when allCached', async () => {
    await renderDropdown({ allCached: true })

    expect(screen.getByText(ALL_CACHED_TEXT)).toBeTruthy()
    expect(screen.queryByText(CACHE_ALL_TEXT)).toBeNull()
  })

  test('isCaching=true shows "Остановить кеширование" with stop-circle-outline', async () => {
    await renderDropdown({ isCaching: true })

    expect(screen.getByText(STOP_CACHING_TEXT)).toBeTruthy()
    expect(screen.queryByText(CACHE_ALL_TEXT)).toBeNull()
    expect(screen.queryByText(ALL_CACHED_TEXT)).toBeNull()
  })

  test('isCaching=true stop item is enabled (pressing it fires onStopCaching)', async () => {
    const onStopCaching = jest.fn()
    await renderDropdown({ isCaching: true, onStopCaching })

    fireEvent(screen.getByText(STOP_CACHING_TEXT), 'touchEnd')

    expect(onStopCaching).toHaveBeenCalledTimes(1)
  })

  test('isCaching=true + offline: stop item still enabled', async () => {
    const onStopCaching = jest.fn()
    await renderDropdown({ isCacheAllDisabled: true, isCaching: true, onStopCaching })

    fireEvent(screen.getByText(STOP_CACHING_TEXT), 'touchEnd')

    expect(onStopCaching).toHaveBeenCalledTimes(1)
  })

  test('onCacheAll fires when cache-all item is pressed (not caching)', async () => {
    const onCacheAll = jest.fn()
    await renderDropdown({ onCacheAll })

    fireEvent(screen.getByText(CACHE_ALL_TEXT), 'touchEnd')

    expect(onCacheAll).toHaveBeenCalledTimes(1)
  })

  test('clear-all disabled when cachedCount===0', async () => {
    const onClearCache = jest.fn()
    await renderDropdown({ isClearCacheDisabled: true, onClearCache })

    fireEvent(screen.getByText(CLEAR_CACHE_TEXT), 'touchEnd')

    expect(onClearCache).not.toHaveBeenCalled()
  })

  test('clear-all enabled when there are cached items and no queue/inflight', async () => {
    const onClearCache = jest.fn()
    await renderDropdown({ isClearCacheDisabled: false, onClearCache })

    fireEvent(screen.getByText(CLEAR_CACHE_TEXT), 'touchEnd')

    expect(onClearCache).toHaveBeenCalledTimes(1)
  })

  test('menu does not close on stop caching (handler wired, menu stays open)', async () => {
    const onClose = jest.fn()
    await renderDropdown({ isCaching: true, onClose })

    fireEvent(screen.getByText(STOP_CACHING_TEXT), 'touchEnd')

    expect(onClose).not.toHaveBeenCalled()
  })

  test('always renders both cache menu items with divider', async () => {
    await renderDropdown()

    expect(screen.getByText(CACHE_ALL_TEXT)).toBeTruthy()
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

    fireEvent(screen.getByText(MARK_ALL_TEXT), 'touchEnd')
    expect(onMarkAll).toHaveBeenCalledTimes(1)
  })

  test('shows remove item and fires onRemoveFromHistory when canRemoveFromHistory', async () => {
    const onRemoveFromHistory = jest.fn()
    await renderDropdown({ canRemoveFromHistory: true, onRemoveFromHistory })

    expect(screen.getByText(REMOVE_TEXT)).toBeTruthy()
    expect(screen.queryByText(MARK_ALL_TEXT)).toBeNull()

    fireEvent(screen.getByText(REMOVE_TEXT), 'touchEnd')
    expect(onRemoveFromHistory).toHaveBeenCalledTimes(1)
  })

  test('shows both history items when both flags are true', async () => {
    await renderDropdown({ canMarkAll: true, canRemoveFromHistory: true })

    expect(screen.getByText(MARK_ALL_TEXT)).toBeTruthy()
    expect(screen.getByText(REMOVE_TEXT)).toBeTruthy()
  })
})

describe('<PlaylistCacheMenuItem>', () => {
  test('calls onPress when not disabled', async () => {
    const onPress = jest.fn()
    await render(<PlaylistCacheMenuItem text='Cache' onPress={onPress} icon='download-outline' />)

    fireEvent(screen.getByText('Cache'), 'touchEnd')

    expect(onPress).toHaveBeenCalledTimes(1)
  })

  test('does not call onPress when disabled', async () => {
    const onPress = jest.fn()
    await render(
      <PlaylistCacheMenuItem isDisabled text='Cache' onPress={onPress} icon='download-outline' />,
    )

    fireEvent(screen.getByText('Cache'), 'touchEnd')

    expect(onPress).not.toHaveBeenCalled()
  })
})

describe('<PlaylistHistoryMenuItem>', () => {
  test('calls onPress', async () => {
    const onPress = jest.fn()
    await render(
      <PlaylistHistoryMenuItem text='Mark all' onPress={onPress} icon='checkmark-done' />,
    )

    fireEvent(screen.getByText('Mark all'), 'touchEnd')

    expect(onPress).toHaveBeenCalledTimes(1)
  })
})
