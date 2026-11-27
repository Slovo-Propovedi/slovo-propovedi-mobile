import { screen } from '@testing-library/react-native'
import { type ComponentType, type ReactNode } from 'react'
import { StyleSheet } from 'react-native'
import { renderWithProviders } from '../../mocks/renderWithProviders'

// jest-expo resolves `.native.tsx` first; the web gesture wrapper is under test.
const { PullToRefresh } = jest.requireActual<{
  PullToRefresh: ComponentType<{
    children: ReactNode
    onRefresh: () => void
    refreshing: boolean
    topOffset?: number
  }>
}>('./PullToRefresh.tsx')

const renderRefresh = (topOffset?: number) =>
  renderWithProviders(
    <PullToRefresh refreshing onRefresh={jest.fn()} topOffset={topOffset}>
      <></>
    </PullToRefresh>,
  )

// The spinner slot is the only absolutely positioned view in the wrapper; its
// `top` and stacking layer are the seams under test.
const spinnerStyle = () =>
  StyleSheet.flatten(
    screen.root?.queryAll(node => StyleSheet.flatten(node.props.style)?.position === 'absolute')[0]
      ?.props.style,
  )

describe('<PullToRefresh> (web)', () => {
  test('offsets the spinner below the floating top chrome when given a top offset', async () => {
    await renderRefresh(96)

    expect(spinnerStyle()?.top).toBe(96)
  })

  test('draws the wide spinner above the scrolling content', async () => {
    await renderRefresh(96)

    // Content paints at 0, the floating chrome at 10: the slot must sit between.
    expect(spinnerStyle()?.zIndex).toBe(5)
  })

  test('keeps the spinner at the top in the compact layout (no offset)', async () => {
    await renderRefresh()

    expect(spinnerStyle()?.top).toBe(0)
  })
})
