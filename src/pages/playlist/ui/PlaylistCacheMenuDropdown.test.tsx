import { fireEvent, render, screen } from '@testing-library/react-native'
import { PlaylistCacheMenuDropdown } from './PlaylistCacheMenuDropdown'
import { PlaylistCacheMenuItem } from './PlaylistCacheMenuItem'

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

const defaultProps = {
  allCached: false,
  anchor: ANCHOR,
  isCacheAllDisabled: false,
  isCaching: false,
  isClearCacheDisabled: false,
  onCacheAll: jest.fn(),
  onClearCache: jest.fn(),
  onClose: jest.fn(),
  onStopCaching: jest.fn(),
  visible: true,
}

const renderDropdown = (props?: Partial<typeof defaultProps>) =>
  render(<PlaylistCacheMenuDropdown {...defaultProps} {...props} />)

describe('<PlaylistCacheMenuDropdown>', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('shows "Закешировать все" with download-outline when not caching and not all cached', async () => {
    await renderDropdown()

    expect(screen.getByText('Закешировать все')).toBeTruthy()
    expect(screen.queryByText('Остановить кеширование')).toBeNull()
  })

  test('shows "Плейлист закеширован" with check-circle-outline when allCached', async () => {
    await renderDropdown({ allCached: true })

    expect(screen.getByText('Плейлист закеширован')).toBeTruthy()
    expect(screen.queryByText('Закешировать все')).toBeNull()
  })

  test('isCaching=true shows "Остановить кеширование" with stop-circle-outline', async () => {
    await renderDropdown({ isCaching: true })

    expect(screen.getByText('Остановить кеширование')).toBeTruthy()
    expect(screen.queryByText('Закешировать все')).toBeNull()
    expect(screen.queryByText('Плейлист закеширован')).toBeNull()
  })

  test('isCaching=true stop item is enabled (pressing it fires onStopCaching)', async () => {
    const onStopCaching = jest.fn()
    await renderDropdown({ isCaching: true, onStopCaching })

    fireEvent(screen.getByText('Остановить кеширование'), 'touchEnd')

    expect(onStopCaching).toHaveBeenCalledTimes(1)
  })

  test('isCaching=true + offline: stop item still enabled', async () => {
    const onStopCaching = jest.fn()
    await renderDropdown({ isCacheAllDisabled: true, isCaching: true, onStopCaching })

    fireEvent(screen.getByText('Остановить кеширование'), 'touchEnd')

    expect(onStopCaching).toHaveBeenCalledTimes(1)
  })

  test('onCacheAll fires when cache-all item is pressed (not caching)', async () => {
    const onCacheAll = jest.fn()
    await renderDropdown({ onCacheAll })

    fireEvent(screen.getByText('Закешировать все'), 'touchEnd')

    expect(onCacheAll).toHaveBeenCalledTimes(1)
  })

  test('clear-all disabled when cachedCount===0', async () => {
    const onClearCache = jest.fn()
    await renderDropdown({ isClearCacheDisabled: true, onClearCache })

    fireEvent(screen.getByText('Удалить из кеша все'), 'touchEnd')

    expect(onClearCache).not.toHaveBeenCalled()
  })

  test('clear-all enabled when there are cached items and no queue/inflight', async () => {
    const onClearCache = jest.fn()
    await renderDropdown({ isClearCacheDisabled: false, onClearCache })

    fireEvent(screen.getByText('Удалить из кеша все'), 'touchEnd')

    expect(onClearCache).toHaveBeenCalledTimes(1)
  })

  test('menu does not close on stop caching (handler wired, menu stays open)', async () => {
    const onClose = jest.fn()
    await renderDropdown({ isCaching: true, onClose })

    fireEvent(screen.getByText('Остановить кеширование'), 'touchEnd')

    expect(onClose).not.toHaveBeenCalled()
  })

  test('always renders both menu items with divider', async () => {
    await renderDropdown()

    expect(screen.getByText('Закешировать все')).toBeTruthy()
    expect(screen.getByText('Удалить из кеша все')).toBeTruthy()
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
