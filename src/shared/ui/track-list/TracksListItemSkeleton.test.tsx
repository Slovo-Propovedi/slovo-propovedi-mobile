import { screen } from '@testing-library/react-native'
import { StyleSheet } from 'react-native'
import { renderWithProviders } from 'shared/mocks/renderWithProviders'
import { DarkTheme, INDENTS, RADIUSES } from 'shared/ui/theme'
import type { TestInstance, TestNode } from 'test-renderer'
import { TracksListItemSkeleton } from './TracksListItemSkeleton'

jest.mock('shared/ui/theme', () => {
  const actual = jest.requireActual('shared/ui/theme')
  return {
    ...actual,
    useTheme: jest.fn(() => ({ currentTheme: actual.DarkTheme })),
  }
})

const SKELETON_TEST_ID = 'tracks-list-item-skeleton'

const asInstance = (node: TestNode): TestInstance => {
  if (typeof node === 'string') throw new Error('Expected a host element, got a text node')
  return node
}

const getSkeletonParts = () => {
  const skeleton = screen.getByTestId(SKELETON_TEST_ID)
  const art = asInstance(skeleton.children[0])
  const textColumn = asInstance(skeleton.children[1])
  const titleBar = asInstance(textColumn.children[0])
  const subtitleBar = asInstance(textColumn.children[1])

  return { art, skeleton, subtitleBar, textColumn, titleBar }
}

describe('<TracksListItemSkeleton>', () => {
  test('renders with the skeleton testID', async () => {
    await renderWithProviders(<TracksListItemSkeleton />)

    expect(screen.getByTestId(SKELETON_TEST_ID)).toBeTruthy()
  })

  test('clones the real row box with the skeleton background and card radius', async () => {
    await renderWithProviders(<TracksListItemSkeleton />)

    const { skeleton } = getSkeletonParts()

    expect(skeleton).toHaveStyle({
      backgroundColor: DarkTheme.skeleton,
      borderRadius: RADIUSES.middle,
    })
  })

  test('renders art and bars with the card background color', async () => {
    await renderWithProviders(<TracksListItemSkeleton />)

    const { art, subtitleBar, titleBar } = getSkeletonParts()

    expect(art).toHaveStyle({ backgroundColor: DarkTheme.card })
    expect(titleBar).toHaveStyle({ backgroundColor: DarkTheme.card })
    expect(subtitleBar).toHaveStyle({ backgroundColor: DarkTheme.card })
  })

  test('renders inside a view with pointerEvents none', async () => {
    await renderWithProviders(<TracksListItemSkeleton />)

    const { skeleton } = getSkeletonParts()
    expect(skeleton).toHaveStyle({ pointerEvents: 'none' })
  })

  test('applies the consumer row style last so screen margins win', async () => {
    const rowStyle = StyleSheet.create({ row: { marginHorizontal: INDENTS.medium } })

    await renderWithProviders(<TracksListItemSkeleton style={rowStyle.row} />)

    const { skeleton } = getSkeletonParts()
    expect(skeleton).toHaveStyle({ marginHorizontal: INDENTS.medium })
  })
})
