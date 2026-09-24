import { createCtx } from '@reatom/framework'
import { userEvent } from '@testing-library/react-native'
import { renderWithProviders } from 'shared/mocks'
import { hapticsEnabledAtom, setHapticsEnabled } from 'shared/model'
import { HapticsSettingsItem } from './HapticsSettingsItem'

const TITLE = 'Виброотклик'
const ROW_BUTTON_NAME = /Виброотклик/

jest.mock('shared/model', () => ({
  hapticsEnabledAtom: jest
    .requireActual<{ atom: (value: boolean, name: string) => unknown }>('@reatom/framework')
    .atom(false, 'hapticsEnabledAtom'),
  setHapticsEnabled: jest.fn(),
}))

const mockedSetHapticsEnabled = setHapticsEnabled as jest.MockedFunction<typeof setHapticsEnabled>

const renderItem = async (enabled: boolean) => {
  const ctx = createCtx()
  hapticsEnabledAtom(ctx, enabled)

  return renderWithProviders(<HapticsSettingsItem />, { ctx })
}

describe('<HapticsSettingsItem>', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('renders the haptics title', async () => {
    const { getByText } = await renderItem(false)

    expect(getByText(TITLE)).toBeTruthy()
  })

  test('tapping the row enables haptics when disabled', async () => {
    const user = userEvent.setup()
    const { getByRole } = await renderItem(false)

    await user.press(getByRole('button', { name: ROW_BUTTON_NAME }))

    expect(mockedSetHapticsEnabled).toHaveBeenCalledWith(expect.anything(), true)
  })

  test('tapping the row disables haptics when enabled', async () => {
    const user = userEvent.setup()
    const { getByRole } = await renderItem(true)

    await user.press(getByRole('button', { name: ROW_BUTTON_NAME }))

    expect(mockedSetHapticsEnabled).toHaveBeenCalledWith(expect.anything(), false)
  })
})
