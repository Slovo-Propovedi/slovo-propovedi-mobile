import { screen, userEvent } from '@testing-library/react-native'
import { type ComponentType } from 'react'
import { renderWithProviders } from '../../mocks/renderWithProviders'
import { RefreshContext } from './refreshContext'

// jest-expo resolves `.native.tsx` first; the web implementation is under test.
const { RefreshButton } = jest.requireActual<{ RefreshButton: ComponentType }>(
  './RefreshButton.tsx',
)

const LABEL = 'Обновить'

const mockMatchMedia = (matches: boolean) => {
  window.matchMedia = jest.fn().mockReturnValue({
    addEventListener: jest.fn(),
    matches,
    removeEventListener: jest.fn(),
  })
}

const renderButton = (context: { onRefresh: () => void; refreshing: boolean } | null) =>
  renderWithProviders(
    <RefreshContext.Provider value={context}>
      <RefreshButton />
    </RefreshContext.Provider>,
  )

describe('<RefreshButton> (web)', () => {
  test('reloads the screen on click with a mouse', async () => {
    mockMatchMedia(true)
    const onRefresh = jest.fn()
    await renderButton({ onRefresh, refreshing: false })

    await userEvent.setup().press(screen.getByRole('button', { name: LABEL }))

    expect(onRefresh).toHaveBeenCalledTimes(1)
  })

  test('is hidden on touch devices (phones, tablets)', async () => {
    mockMatchMedia(false)
    await renderButton({ onRefresh: jest.fn(), refreshing: false })

    expect(screen.queryByRole('button', { name: LABEL })).toBeNull()
  })

  test('is hidden outside a PullToRefresh', async () => {
    mockMatchMedia(true)
    await renderButton(null)

    expect(screen.queryByRole('button', { name: LABEL })).toBeNull()
  })

  test('shows a spinner instead of the button while refreshing', async () => {
    mockMatchMedia(true)
    await renderButton({ onRefresh: jest.fn(), refreshing: true })

    expect(screen.queryByRole('button', { name: LABEL })).toBeNull()
  })
})
