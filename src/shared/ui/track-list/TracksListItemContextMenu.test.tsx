import { fireEvent, render, screen } from '@testing-library/react-native'
import '@testing-library/jest-native/extend-expect'
import { DarkTheme } from 'shared/ui/theme'
import { TracksListItemContextMenu } from './TracksListItemContextMenu'

const ADD_CACHE_TEXT = 'Добавить в кеш'
const REMOVE_CACHE_TEXT = 'Удалить из кеша'

jest.mock('@expo/vector-icons', () => ({
  Ionicons: (props: { name: string }) => {
    const { Text } = jest.requireActual('react-native')
    return <Text testID={`icon-${props.name}`}>{props.name}</Text>
  },
}))

const expectRenderedRoot = (result: Awaited<ReturnType<typeof render>>) => {
  if (!result.root) throw new Error('Expected component to render a root element')

  return result.root
}

const baseProps = {
  isCached: false,
  isMenuOpen: true,
  menuHeight: 44,
  menuPosition: { x: 0, y: 0 },
  onClose: jest.fn(),
  onMenuHeightChange: jest.fn(),
  onToggleCache: jest.fn(),
  theme: DarkTheme,
}

describe('<TracksListItemContextMenu>', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('returns null when isMenuOpen is false', async () => {
    const { toJSON } = await render(<TracksListItemContextMenu {...baseProps} isMenuOpen={false} />)

    expect(toJSON()).toBeNull()
  })

  test('renders add cache text when isCached is false', async () => {
    await render(<TracksListItemContextMenu {...baseProps} isCached={false} />)

    expect(screen.getByText(ADD_CACHE_TEXT)).toBeTruthy()
  })

  test('renders remove cache text when isCached is true', async () => {
    await render(<TracksListItemContextMenu {...baseProps} isCached={true} />)

    expect(screen.getByText(REMOVE_CACHE_TEXT)).toBeTruthy()
  })

  test('pressing cache toggle button calls onToggleCache', async () => {
    await render(<TracksListItemContextMenu {...baseProps} />)

    fireEvent.press(screen.getByRole('button'))

    expect(baseProps.onToggleCache).toHaveBeenCalledTimes(1)
  })

  test('handleLayout calls onMenuHeightChange when height differs', async () => {
    const result = await render(<TracksListItemContextMenu {...baseProps} menuHeight={44} />)
    const root = expectRenderedRoot(result)

    const menuView = root.queryAll(el => el.props.onLayout)[0]
    fireEvent(menuView, 'layout', {
      nativeEvent: { layout: { height: 99 } },
    })

    expect(baseProps.onMenuHeightChange).toHaveBeenCalledWith(99)
  })

  test('handleLayout does not call onMenuHeightChange when height equals menuHeight', async () => {
    const result = await render(<TracksListItemContextMenu {...baseProps} menuHeight={44} />)
    const root = expectRenderedRoot(result)

    const menuView = root.queryAll(el => el.props.onLayout)[0]
    fireEvent(menuView, 'layout', {
      nativeEvent: { layout: { height: 44 } },
    })

    expect(baseProps.onMenuHeightChange).not.toHaveBeenCalled()
  })

  test('renders menuActions items and hides cache item', async () => {
    const customActions = [
      { onPress: jest.fn(), text: 'Custom Action 1' },
      { onPress: jest.fn(), text: 'Custom Action 2' },
    ]

    await render(<TracksListItemContextMenu {...baseProps} menuActions={customActions} />)

    expect(screen.getByText('Custom Action 1')).toBeTruthy()
    expect(screen.getByText('Custom Action 2')).toBeTruthy()
    expect(screen.queryByText(ADD_CACHE_TEXT)).toBeNull()
    expect(screen.queryByText(REMOVE_CACHE_TEXT)).toBeNull()
  })

  test('pressing menuActions item calls its onPress and onClose', async () => {
    const customOnPress = jest.fn()
    const customActions = [{ onPress: customOnPress, text: 'Share' }]

    await render(<TracksListItemContextMenu {...baseProps} menuActions={customActions} />)

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

    expect(screen.getByText(ADD_CACHE_TEXT)).toBeTruthy()
  })
})
