import { type ReactNode } from 'react'
import { StyleSheet, Text } from 'react-native'
import { renderWithProviders } from '../../mocks/renderWithProviders'
import {
  BAR_TOP_ISLAND_MARGIN,
  WIDE_ACTIONS_CENTER_Y,
  WIDE_BAR_ROW_HEIGHT,
  WIDE_TAB_ISLAND_HEIGHT,
} from '../layout/bottomBarLayout'
import { RefreshContext } from '../refresh-control/refreshContext'
import { INDENTS, MIN_TOUCH_TARGET } from '../theme/themed'
import { WideTopActions } from './WideTopActions'

const WIDE_DIMENSIONS = { fontScale: 1, height: 800, width: 1024 }
const COMPACT_DIMENSIONS = { fontScale: 1, height: 390, width: 844 }
const TEST_ID = 'wide-top-actions'
const SPINNER_ID = 'wide-top-actions-spinner'

const mockUseWindowDimensions = jest.fn(() => WIDE_DIMENSIONS)

jest.mock('react-native/Libraries/Utilities/useWindowDimensions', () => ({
  __esModule: true,
  default: () => mockUseWindowDimensions(),
}))

// The island is bottom-anchored inside the chrome row, so its top edge sits the
// row's leftover height below the row top.
const ISLAND_TOP = BAR_TOP_ISLAND_MARGIN + WIDE_BAR_ROW_HEIGHT - WIDE_TAB_ISLAND_HEIGHT

const renderOverlay = (refreshing: boolean | null, children: ReactNode = <Text>action</Text>) =>
  renderWithProviders(
    <RefreshContext.Provider
      value={refreshing === null ? null : { onRefresh: jest.fn(), refreshing }}
    >
      <WideTopActions>{children}</WideTopActions>
    </RefreshContext.Provider>,
  )

describe('<WideTopActions>', () => {
  afterEach(() => {
    mockUseWindowDimensions.mockReturnValue(WIDE_DIMENSIONS)
  })

  test('floats the children at the top-right, centred on the wide island', async () => {
    const { getByTestId, getByText } = await renderOverlay(false)

    const overlay = getByTestId(TEST_ID)
    const style = StyleSheet.flatten(overlay.props.style)

    expect(getByText('action')).toBeTruthy()
    expect(style.position).toBe('absolute')
    expect(style.right).toBe(INDENTS.low)
    expect(style.top).toBe(ISLAND_TOP)
    expect(style.height).toBe(WIDE_TAB_ISLAND_HEIGHT)
    // The empty slot passes touches through to the scrolling content below.
    expect(overlay.props.pointerEvents).toBe('box-none')
  })

  test('centres the refresh spinner on the screen while refreshing', async () => {
    const { getByTestId } = await renderOverlay(true)

    const spinner = getByTestId(SPINNER_ID)
    const style = StyleSheet.flatten(spinner.props.style)

    // Pinned to both body edges with centred content: the spinner sits on the
    // horizontal centre of the screen, not beside the action buttons.
    expect(style.position).toBe('absolute')
    expect(style.left).toBe(0)
    expect(style.right).toBe(0)
    expect(style.alignItems).toBe('center')
    expect(style.height).toBe(MIN_TOUCH_TARGET)
    // Its vertical centre is level with the actions row.
    expect(style.top).toBe(WIDE_ACTIONS_CENTER_Y - MIN_TOUCH_TARGET / 2)
  })

  test('keeps the spinner out of the actions row', async () => {
    const { getByTestId } = await renderOverlay(true)

    expect(getByTestId(TEST_ID)).not.toContainElement(getByTestId(SPINNER_ID))
  })

  test('hides the refresh spinner when idle', async () => {
    const { queryByTestId } = await renderOverlay(false)

    expect(queryByTestId(SPINNER_ID)).toBeNull()
  })

  test('renders nothing in the compact layout', async () => {
    mockUseWindowDimensions.mockReturnValue(COMPACT_DIMENSIONS)

    const { queryByTestId } = await renderOverlay(true)

    expect(queryByTestId(TEST_ID)).toBeNull()
  })
})
