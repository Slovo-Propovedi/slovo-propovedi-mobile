import { screen } from '@testing-library/react-native'
import { type ComponentType, type ReactNode } from 'react'
import { StyleSheet, View } from 'react-native'
import { renderWithProviders } from '../../mocks/renderWithProviders'
import { WIDE_TOP_CHROME_SCROLL_INSET } from '../layout/bottomBarLayout'
import { getRefreshTopOffset, SPINNER_SLOT_HEIGHT } from './pull-to-refresh.lib'

// jest-expo resolves `.native.tsx` first; the web gesture wrapper is under test.
const { PullToRefresh } = jest.requireActual<{
  PullToRefresh: ComponentType<{
    children: ReactNode
    onRefresh: () => void
    refreshing: boolean
    topOffset?: number
  }>
}>('./PullToRefresh.tsx')

const CONTENT_ID = 'refresh-content'

const renderRefresh = (topOffset?: number) =>
  renderWithProviders(
    <PullToRefresh refreshing onRefresh={jest.fn()} topOffset={topOffset}>
      <View testID={CONTENT_ID} />
    </PullToRefresh>,
  )

// The spinner slot is the only absolutely positioned view in the wrapper.
const spinnerNode = () =>
  screen.root?.queryAll(node => StyleSheet.flatten(node.props.style)?.position === 'absolute')[0]

const spinnerStyle = () => StyleSheet.flatten(spinnerNode()?.props.style)

describe('<PullToRefresh> (web)', () => {
  test('renders the spinner inside the translated content wrapper', async () => {
    await renderRefresh(getRefreshTopOffset(true))

    // Same parent as the scrollable: the slot scrolls with the content instead
    // of floating in a separate overlay above it.
    expect(spinnerNode()?.parent).toBe(screen.getByTestId(CONTENT_ID).parent)
  })

  test('sits in the island-clearance zone above the first content row', async () => {
    await renderRefresh(getRefreshTopOffset(true))

    // The slot's bottom edge meets the first content row.
    expect(spinnerStyle()?.top).toBe(WIDE_TOP_CHROME_SCROLL_INSET - SPINNER_SLOT_HEIGHT)
    expect((spinnerStyle()?.top ?? 0) + SPINNER_SLOT_HEIGHT).toBe(WIDE_TOP_CHROME_SCROLL_INSET)
  })

  test('paints with the content instead of a separate stacking layer', async () => {
    await renderRefresh(getRefreshTopOffset(true))

    expect(spinnerStyle()?.zIndex).toBeUndefined()
  })

  test('keeps the spinner at the content top in the compact layout (no offset)', async () => {
    await renderRefresh()

    expect(spinnerStyle()?.top).toBe(0)
  })
})
