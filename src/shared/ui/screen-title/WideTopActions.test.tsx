import { screen } from '@testing-library/react-native'
import { type ReactNode } from 'react'
import { StyleSheet, Text } from 'react-native'
import { type SharedValue } from 'react-native-reanimated'
import { getSharedTestCtx, renderWithProviders } from '../../mocks/renderWithProviders'
import {
  BAR_TOP_ISLAND_MARGIN,
  WIDE_ACTIONS_CENTER_Y,
  WIDE_BAR_ROW_HEIGHT,
  WIDE_TAB_ISLAND_HEIGHT,
} from '../layout/bottomBarLayout'
import { RefreshContext } from '../refresh-control/refreshContext'
import { currentThemeAtom } from '../theme/model'
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

const progressValue = (value: number) => ({ value }) as unknown as SharedValue<number>

const overlayElement = (
  refreshing: boolean | null,
  progress: SharedValue<number>,
  isArmed = false,
  children: ReactNode = <Text>action</Text>,
) => (
  <RefreshContext.Provider
    value={
      refreshing === null
        ? null
        : { isArmed, onRefresh: jest.fn(), pullProgress: progress, refreshing }
    }
  >
    <WideTopActions>{children}</WideTopActions>
  </RefreshContext.Provider>
)

const renderOverlay = (
  refreshing: boolean | null,
  { isArmed = false, progress = progressValue(0) } = {},
) => renderWithProviders(overlayElement(refreshing, progress, isArmed))

// ActivityIndicator forwards its tint to the host node as a `color` prop.
const renderedSpinnerColor = () =>
  screen.getByTestId(SPINNER_ID).queryAll(instance => typeof instance.props.color === 'string')[0]
    ?.props.color

const theme = () => getSharedTestCtx().get(currentThemeAtom)

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
    // A settled refresh keeps the spinner fully visible.
    expect(style.opacity).toBe(1)
  })

  test('fades the spinner in with the pull progress before the release', async () => {
    const { getByTestId } = await renderOverlay(false, { progress: progressValue(0.5) })

    // The spinner is already visible mid-gesture, so a user can see the refresh
    // coming and cancel; its opacity tracks the pull.
    expect(StyleSheet.flatten(getByTestId(SPINNER_ID).props.style)?.opacity).toBe(0.5)
  })

  test('tints the spinner gray below the trigger threshold', async () => {
    await renderOverlay(false, { isArmed: false, progress: progressValue(0.5) })

    // Same tint rule as the compact spinner: muted until the pull arms.
    expect(renderedSpinnerColor()).toBe(theme().textMuted)
  })

  test('recolors the spinner primary once the pull passes the trigger threshold', async () => {
    await renderOverlay(false, { isArmed: true, progress: progressValue(1) })

    expect(renderedSpinnerColor()).toBe(theme().primary)
  })

  test('keeps the spinner primary while the refresh is running', async () => {
    await renderOverlay(true, { isArmed: false })

    expect(renderedSpinnerColor()).toBe(theme().primary)
  })

  test('hides the spinner again when the pull is cancelled', async () => {
    const progress = progressValue(0.6)
    const { getByTestId, rerender } = await renderOverlay(false, { progress })

    expect(StyleSheet.flatten(getByTestId(SPINNER_ID).props.style)?.opacity).toBe(0.6)

    progress.value = 0
    await rerender(overlayElement(false, progress))

    expect(StyleSheet.flatten(getByTestId(SPINNER_ID).props.style)?.opacity).toBe(0)
  })

  test('keeps the spinner out of the actions row', async () => {
    const { getByTestId } = await renderOverlay(true)

    expect(getByTestId(TEST_ID)).not.toContainElement(getByTestId(SPINNER_ID))
  })

  test('hides the refresh spinner when idle', async () => {
    const { getByTestId } = await renderOverlay(false)

    // The slot stays mounted so the shared pull value can fade it in without a
    // re-render; at rest it is fully transparent.
    expect(StyleSheet.flatten(getByTestId(SPINNER_ID).props.style)?.opacity).toBe(0)
  })

  test('renders nothing in the compact layout', async () => {
    mockUseWindowDimensions.mockReturnValue(COMPACT_DIMENSIONS)

    const { queryByTestId } = await renderOverlay(true)

    expect(queryByTestId(TEST_ID)).toBeNull()
  })
})
