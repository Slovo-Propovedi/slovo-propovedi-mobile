import { act, fireEvent, render, screen } from '@testing-library/react-native'
import type { TrackCacheVisualState } from 'shared/lib/audio-cache'
import type { TestInstance } from 'test-renderer'
import { TracksListItemContextMenu } from './TracksListItemContextMenu'

const ADD_TO_OFFLINE_TEXT = 'Добавить в офлайн'
const REMOVE_CACHE_TEXT = 'Удалить из офлайн'
const STOP_CACHING_TEXT = 'Остановить добавление в офлайн'
const REMOVE_FROM_QUEUE_TEXT = 'Убрать из очереди'

jest.mock('@expo/vector-icons', () => ({
  Ionicons: (props: { name: string }) => {
    const { Text } = jest.requireActual('react-native')
    return <Text testID={`icon-${props.name}`}>{props.name}</Text>
  },
}))

jest.mock('shared/ui/theme', () => {
  const actual = jest.requireActual('shared/ui/theme')
  return {
    ...actual,
    useTheme: jest.fn(() => ({ currentTheme: actual.DarkTheme })),
  }
})

const baseProps = {
  anchor: { height: 0, width: 0, x: 0, y: 0 },
  isCached: false,
  isMenuOpen: true,
  onClose: jest.fn(),
  onToggleCache: jest.fn(),
  visualState: 'cloud' as TrackCacheVisualState,
}

const measureMenu = async (container: TestInstance) => {
  const layoutView = container.queryAll(node => node.props.onLayout !== undefined, {
    includeSelf: true,
  })[0]
  await act(async () => {
    fireEvent(layoutView, 'layout', {
      nativeEvent: { layout: { height: 100, width: 160, x: 0, y: 0 } },
    })
  })
}

describe('<TracksListItemContextMenu>', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('returns null when isMenuOpen is false', async () => {
    const { toJSON } = await render(<TracksListItemContextMenu {...baseProps} isMenuOpen={false} />)

    expect(toJSON()).toBeNull()
  })

  test('renders add to offline text when visualState is cloud', async () => {
    await render(<TracksListItemContextMenu {...baseProps} visualState='cloud' />)

    expect(screen.getByText(ADD_TO_OFFLINE_TEXT)).toBeTruthy()
    expect(screen.getByTestId('icon-cloud-download')).toBeTruthy()
  })

  test('renders remove cache text when visualState is cached', async () => {
    await render(<TracksListItemContextMenu {...baseProps} isCached={true} visualState='cached' />)

    expect(screen.getByText(REMOVE_CACHE_TEXT)).toBeTruthy()
    expect(screen.getByTestId('icon-trash-outline')).toBeTruthy()
  })

  test('renders stop caching text when visualState is downloading', async () => {
    await render(<TracksListItemContextMenu {...baseProps} visualState='downloading' />)

    expect(screen.getByText(STOP_CACHING_TEXT)).toBeTruthy()
  })

  test('renders remove from queue text when visualState is queued', async () => {
    await render(<TracksListItemContextMenu {...baseProps} visualState='queued' />)

    expect(screen.getByText(REMOVE_FROM_QUEUE_TEXT)).toBeTruthy()
  })

  test('renders add to offline text when playing and not cached', async () => {
    await render(
      <TracksListItemContextMenu {...baseProps} isCached={false} visualState='playing' />,
    )

    expect(screen.getByText(ADD_TO_OFFLINE_TEXT)).toBeTruthy()
  })

  test('renders remove cache text when playing and cached', async () => {
    await render(<TracksListItemContextMenu {...baseProps} isCached={true} visualState='playing' />)

    expect(screen.getByText(REMOVE_CACHE_TEXT)).toBeTruthy()
  })

  test('pressing cache toggle button calls onToggleCache', async () => {
    const { container } = await render(<TracksListItemContextMenu {...baseProps} />)

    await measureMenu(container)

    fireEvent.press(screen.getByRole('button'))

    expect(baseProps.onToggleCache).toHaveBeenCalledTimes(1)
  })

  test('renders menuActions items in addition to cache item', async () => {
    const customActions = [
      { onPress: jest.fn(), text: 'Custom Action 1' },
      { onPress: jest.fn(), text: 'Custom Action 2' },
    ]

    await render(<TracksListItemContextMenu {...baseProps} menuActions={customActions} />)

    expect(screen.getByText('Custom Action 1')).toBeTruthy()
    expect(screen.getByText('Custom Action 2')).toBeTruthy()
    expect(screen.getByText(ADD_TO_OFFLINE_TEXT)).toBeTruthy()
  })

  test('pressing menuActions item calls its onPress and onClose', async () => {
    const customOnPress = jest.fn()
    const customActions = [{ onPress: customOnPress, text: 'Share' }]

    const { container } = await render(
      <TracksListItemContextMenu {...baseProps} menuActions={customActions} />,
    )

    await measureMenu(container)

    fireEvent.press(screen.getByText('Share'))

    expect(customOnPress).toHaveBeenCalledTimes(1)
    expect(baseProps.onClose).toHaveBeenCalledTimes(1)
  })

  test('renders icon in menuActions when icon is provided', async () => {
    const customActions = [{ icon: 'share-outline' as const, onPress: jest.fn(), text: 'Share' }]

    await render(<TracksListItemContextMenu {...baseProps} menuActions={customActions} />)

    expect(screen.getByText('Share')).toBeTruthy()
    expect(screen.getByTestId('icon-share-outline')).toBeTruthy()
  })

  test('renders cache item when menuActions is absent', async () => {
    await render(<TracksListItemContextMenu {...baseProps} />)

    expect(screen.getByText(ADD_TO_OFFLINE_TEXT)).toBeTruthy()
  })

  test('disables cache item when isCacheDisabled is true', async () => {
    await render(<TracksListItemContextMenu {...baseProps} isCacheDisabled={true} />)

    const cacheButton = screen.getByRole('button')
    expect(cacheButton).toBeDisabled()
    expect(cacheButton.props.onPress).toBeUndefined()
    expect(cacheButton.props.style).toEqual(expect.arrayContaining([{ opacity: 0.5 }]))
  })
})
