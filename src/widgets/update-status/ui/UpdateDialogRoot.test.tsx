import { createCtx } from '@reatom/framework'
import { act, fireEvent } from '@testing-library/react-native'
import { useUpdateInstall } from 'features/app-update'
import { renderWithProviders } from 'shared/mocks'
import { updateDialogVisibleAtom, type UpdateState } from 'shared/model'
import { UpdateDialogRoot } from './UpdateDialogRoot'

const CONFIRM_BUTTON_TEXT = 'Обновить'
const CANCEL_BUTTON_TEXT = 'Не обновлять'
const DIALOG_TITLE = 'Доступно обновление'

jest.mock('features/app-update', () => ({
  useUpdateInstall: jest.fn(),
}))

const mockedUseUpdateInstall = useUpdateInstall as jest.MockedFunction<typeof useUpdateInstall>

const buildHookReturn = (overrides?: Partial<ReturnType<typeof useUpdateInstall>>) => ({
  error: null,
  progress: 0,
  reset: jest.fn(),
  startUpdate: jest.fn(),
  updateState: 'idle' as UpdateState,
  ...overrides,
})

describe('<UpdateDialogRoot>', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockedUseUpdateInstall.mockReturnValue(buildHookReturn())
  })

  test('renders nothing when the dialog is hidden', async () => {
    const { queryByText } = await renderWithProviders(<UpdateDialogRoot />)

    expect(queryByText(DIALOG_TITLE)).toBeNull()
  })

  test('renders the confirm dialog when an update is detected', async () => {
    const ctx = createCtx()
    updateDialogVisibleAtom(ctx, true)

    const { getByRole, getByText } = await renderWithProviders(<UpdateDialogRoot />, { ctx })

    expect(getByText(DIALOG_TITLE)).toBeTruthy()
    expect(getByRole('button', { name: CONFIRM_BUTTON_TEXT })).toBeTruthy()
    expect(getByRole('button', { name: CANCEL_BUTTON_TEXT })).toBeTruthy()
  })

  test('hides the dialog on cancel and shows it again when reopened', async () => {
    const ctx = createCtx()
    updateDialogVisibleAtom(ctx, true)

    const { getByRole, getByText, queryByText } = await renderWithProviders(<UpdateDialogRoot />, {
      ctx,
    })

    await act(async () => {
      fireEvent.press(getByRole('button', { name: CANCEL_BUTTON_TEXT }))
    })

    expect(queryByText(DIALOG_TITLE)).toBeNull()

    await act(async () => {
      updateDialogVisibleAtom(ctx, true)
    })

    expect(getByText(DIALOG_TITLE)).toBeTruthy()
  })
})
