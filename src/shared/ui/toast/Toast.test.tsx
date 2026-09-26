import { createCtx } from '@reatom/framework'
import { renderWithProviders } from 'shared/mocks'
import { toastAtom } from 'shared/model'
import { Toast } from './Toast'

const TOAST_MESSAGE = 'Ссылка скопирована'

describe('<Toast>', () => {
  test('renders nothing when there is no toast message', async () => {
    const ctx = createCtx()

    const { queryByRole } = await renderWithProviders(<Toast />, { ctx })

    expect(queryByRole('alert')).toBeNull()
  })

  test('shows the message set on the toast atom', async () => {
    const ctx = createCtx()
    toastAtom(ctx, TOAST_MESSAGE)

    const { getByText } = await renderWithProviders(<Toast />, { ctx })

    expect(getByText(TOAST_MESSAGE)).toBeTruthy()
  })

  test('does not intercept touches', async () => {
    const ctx = createCtx()
    toastAtom(ctx, TOAST_MESSAGE)

    const { getByText } = await renderWithProviders(<Toast />, { ctx })

    expect(getByText(TOAST_MESSAGE).parent).toHaveStyle({ pointerEvents: 'none' })
  })
})
