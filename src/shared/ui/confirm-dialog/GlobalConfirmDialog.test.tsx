import { act, fireEvent, screen } from '@testing-library/react-native'
import '@testing-library/jest-native/extend-expect'
import { renderWithProviders } from 'shared/mocks/renderWithProviders'
import { globalInfoAtom } from 'shared/model/info-dialog'
import { GlobalConfirmDialog } from './GlobalConfirmDialog'

const DEFAULT_TITLE = 'Информация'
const CONFIRM_TEXT = 'Понятно'
const MESSAGE = 'Невозможно воспроизвести незакешированную проповедь без интернета'
const CUSTOM_TITLE = 'Скоро будет доступно'

describe('<GlobalConfirmDialog>', () => {
  test('renders nothing when atom is null', async () => {
    await renderWithProviders(<GlobalConfirmDialog />)

    expect(screen.queryByText(DEFAULT_TITLE)).toBeNull()
    expect(screen.queryByText(CONFIRM_TEXT)).toBeNull()
  })

  test('shows message, default title and confirm button when atom is set', async () => {
    const { ctx } = await renderWithProviders(<GlobalConfirmDialog />)

    await act(async () => {
      globalInfoAtom(ctx, { message: MESSAGE })
    })

    expect(screen.getByText(MESSAGE)).toBeTruthy()
    expect(screen.getByText(DEFAULT_TITLE)).toBeTruthy()
    expect(screen.getByText(CONFIRM_TEXT)).toBeTruthy()
  })

  test('pressing confirm dismisses the dialog', async () => {
    const { ctx } = await renderWithProviders(<GlobalConfirmDialog />)

    await act(async () => {
      globalInfoAtom(ctx, { message: MESSAGE })
    })

    fireEvent.press(screen.getByText(CONFIRM_TEXT))

    expect(ctx.get(globalInfoAtom)).toBeNull()
  })

  test('renders custom title when provided', async () => {
    const { ctx } = await renderWithProviders(<GlobalConfirmDialog />)

    await act(async () => {
      globalInfoAtom(ctx, { message: MESSAGE, title: CUSTOM_TITLE })
    })

    expect(screen.getByText(CUSTOM_TITLE)).toBeTruthy()
  })
})
