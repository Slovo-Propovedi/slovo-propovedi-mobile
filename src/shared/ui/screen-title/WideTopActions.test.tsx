import { render } from '@testing-library/react-native'
import { StyleSheet, Text } from 'react-native'
import {
  BAR_ROW_MIN_HEIGHT,
  BAR_TOP_ISLAND_MARGIN,
  TAB_BAR_ISLAND_HEIGHT_EXPANDED,
} from '../layout/bottomBarLayout'
import { INDENTS } from '../theme/themed'
import { WideTopActions } from './WideTopActions'

const WIDE_DIMENSIONS = { fontScale: 1, height: 800, width: 1024 }
const COMPACT_DIMENSIONS = { fontScale: 1, height: 390, width: 844 }
const TEST_ID = 'wide-top-actions'

const mockUseWindowDimensions = jest.fn(() => WIDE_DIMENSIONS)

jest.mock('react-native/Libraries/Utilities/useWindowDimensions', () => ({
  __esModule: true,
  default: () => mockUseWindowDimensions(),
}))

// The island is bottom-anchored inside the chrome row, so its top edge sits the
// row's leftover height below the row top.
const ISLAND_TOP = BAR_TOP_ISLAND_MARGIN + BAR_ROW_MIN_HEIGHT - TAB_BAR_ISLAND_HEIGHT_EXPANDED

describe('<WideTopActions>', () => {
  afterEach(() => {
    mockUseWindowDimensions.mockReturnValue(WIDE_DIMENSIONS)
  })

  test('floats the children at the top-right, centred on the wide island', async () => {
    const { getByTestId, getByText } = await render(
      <WideTopActions>
        <Text>action</Text>
      </WideTopActions>,
    )

    const overlay = getByTestId(TEST_ID)
    const style = StyleSheet.flatten(overlay.props.style)

    expect(getByText('action')).toBeTruthy()
    expect(style.position).toBe('absolute')
    expect(style.right).toBe(INDENTS.low)
    expect(style.top).toBe(ISLAND_TOP)
    expect(style.height).toBe(TAB_BAR_ISLAND_HEIGHT_EXPANDED)
    // The empty slot passes touches through to the scrolling content below.
    expect(overlay.props.pointerEvents).toBe('box-none')
  })

  test('renders nothing in the compact layout', async () => {
    mockUseWindowDimensions.mockReturnValue(COMPACT_DIMENSIONS)

    const { queryByTestId } = await render(
      <WideTopActions>
        <Text>action</Text>
      </WideTopActions>,
    )

    expect(queryByTestId(TEST_ID)).toBeNull()
  })
})
