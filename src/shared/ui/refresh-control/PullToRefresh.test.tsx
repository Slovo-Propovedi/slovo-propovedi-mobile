import { screen } from '@testing-library/react-native'
import { type ComponentType, type ReactNode, useContext } from 'react'
import { StyleSheet, Text } from 'react-native'
import { renderWithProviders } from '../../mocks/renderWithProviders'
import { useIsWideLayout } from '../layout/lib/useIsWideLayout'
import { getRefreshTopOffset } from './pull-to-refresh.lib'
import { RefreshContext } from './refreshContext'

// jest-expo resolves `.native.tsx` first; the web gesture wrapper is under test.
const { PullToRefresh } = jest.requireActual<{
  PullToRefresh: ComponentType<{
    children: ReactNode
    onRefresh: () => void
    refreshing: boolean
    topOffset?: number
  }>
}>('./PullToRefresh.tsx')

jest.mock('../layout/lib/useIsWideLayout', () => ({ useIsWideLayout: jest.fn() }))

const mockUseIsWideLayout = useIsWideLayout as jest.MockedFunction<typeof useIsWideLayout>

const WIRED_TEXT = 'refresh-wired'

const ContextProbe = () => {
  const context = useContext(RefreshContext)

  return <Text>{context ? WIRED_TEXT : 'no-refresh'}</Text>
}

const renderRefresh = (topOffset?: number, children: ReactNode = <></>) =>
  renderWithProviders(
    <PullToRefresh refreshing onRefresh={jest.fn()} topOffset={topOffset}>
      {children}
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
  beforeEach(() => {
    mockUseIsWideLayout.mockReturnValue(false)
  })

  test('leaves the wide spinner to the actions container', async () => {
    mockUseIsWideLayout.mockReturnValue(true)

    await renderRefresh(getRefreshTopOffset(true))

    // In the wide layout the fixed WideTopActions overlay owns the spinner, so
    // the pull wrapper must not render a second one.
    expect(spinnerStyle()).toBeUndefined()
  })

  test('keeps the wide refresh wiring for the overlay', async () => {
    mockUseIsWideLayout.mockReturnValue(true)

    await renderRefresh(getRefreshTopOffset(true), <ContextProbe />)

    expect(screen.getByText(WIRED_TEXT)).toBeTruthy()
  })

  test('keeps the spinner at the top in the compact layout (no offset)', async () => {
    await renderRefresh()

    expect(spinnerStyle()?.top).toBe(0)
  })
})
