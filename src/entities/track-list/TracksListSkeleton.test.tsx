import { StyleSheet } from 'react-native'
import { renderWithProviders } from 'shared/mocks/renderWithProviders'
import { INDENTS } from 'shared/ui/theme'
import { TracksListSkeleton } from './TracksListSkeleton'

jest.mock('./TracksListItemSkeleton', () => {
  const { View } = jest.requireActual('react-native')
  return {
    TracksListItemSkeleton: ({ style }: { style?: unknown }) => (
      <View style={style} testID='tracks-list-item-skeleton' />
    ),
  }
})

jest.mock('./styles', () => ({
  createTracksListStyles: () => ({ divider: { height: 1, marginLeft: 60 } }),
}))

const ROW_TEST_ID = 'tracks-list-item-skeleton'
const DIVIDER_HEIGHT = 1

describe('<TracksListSkeleton>', () => {
  test('renders six skeleton rows by default', async () => {
    const { getAllByTestId } = await renderWithProviders(<TracksListSkeleton />)

    expect(getAllByTestId(ROW_TEST_ID)).toHaveLength(6)
  })

  test('renders the requested number of rows', async () => {
    const { getAllByTestId } = await renderWithProviders(<TracksListSkeleton rowCount={3} />)

    expect(getAllByTestId(ROW_TEST_ID)).toHaveLength(3)
  })

  test('separates rows with the standard divider by default', async () => {
    const { container } = await renderWithProviders(<TracksListSkeleton rowCount={4} />)

    const dividers = container.queryAll(node => node.props.style?.height === DIVIDER_HEIGHT)

    expect(dividers).toHaveLength(3)
  })

  test('omits dividers when showDividers is false', async () => {
    const { container } = await renderWithProviders(
      <TracksListSkeleton rowCount={4} showDividers={false} />,
    )

    const dividers = container.queryAll(node => node.props.style?.height === DIVIDER_HEIGHT)

    expect(dividers).toHaveLength(0)
  })

  test('applies rowStyle to every row', async () => {
    const rowStyle = StyleSheet.create({ row: { marginHorizontal: INDENTS.medium } })

    const { getAllByTestId } = await renderWithProviders(
      <TracksListSkeleton rowStyle={rowStyle.row} />,
    )

    expect(getAllByTestId(ROW_TEST_ID)[0]).toHaveStyle({ marginHorizontal: INDENTS.medium })
  })
})
