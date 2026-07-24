import { fireEvent, render, screen } from '@testing-library/react-native'
import '@testing-library/jest-native/extend-expect'
import { DarkTheme } from 'shared/ui/theme'
import { TracksListItemContextMenu } from './TracksListItemContextMenu'

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

  test('renders "Добавить в кеш" when isCached is false', async () => {
    await render(<TracksListItemContextMenu {...baseProps} isCached={false} />)

    expect(screen.getByText('Добавить в кеш')).toBeTruthy()
  })

  test('renders "Удалить из кеша" when isCached is true', async () => {
    await render(<TracksListItemContextMenu {...baseProps} isCached={true} />)

    expect(screen.getByText('Удалить из кеша')).toBeTruthy()
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
})
