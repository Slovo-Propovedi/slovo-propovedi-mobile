import { renderWithProviders } from '../../mocks/renderWithProviders'
import { AdminShellSkeleton } from './admin-shell-skeleton'

const ROW_COUNT = 6

describe('<AdminShellSkeleton>', () => {
  test('renders placeholder rows for the admin shell', async () => {
    const { findAllByTestId } = await renderWithProviders(<AdminShellSkeleton />)

    expect((await findAllByTestId('admin-skeleton-row')).length).toBe(ROW_COUNT)
  })
})
