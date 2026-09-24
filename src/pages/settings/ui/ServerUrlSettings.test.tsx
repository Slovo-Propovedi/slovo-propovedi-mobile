import { createCtx } from '@reatom/framework'
import { userEvent } from '@testing-library/react-native'
import { serverUrlAtom } from 'entities/settings'
import { renderWithProviders } from 'shared/mocks'
import { ServerUrlSettings } from './ServerUrlSettings'

const TEST_URL = 'https://test.example.com'
const DRAFT_URL = 'https://draft.example.com'
const ROW_BUTTON_NAME = /URL сервера API/
const SAVE_BUTTON_NAME = /Сохран/
const INPUT_PLACEHOLDER = 'https://api.example.com'

jest.mock('shared/api/axiosInstance', () => ({
  axiosInstance: { defaults: { baseURL: TEST_URL } },
}))

const renderWithCtx = async () => {
  const ctx = createCtx()
  serverUrlAtom(ctx, TEST_URL)
  return renderWithProviders(<ServerUrlSettings />, { ctx })
}

describe('<ServerUrlSettings>', () => {
  test('is collapsed by default and expands on row press', async () => {
    const user = userEvent.setup()
    const { getByRole, queryByPlaceholderText } = await renderWithCtx()
    const row = getByRole('button', { name: ROW_BUTTON_NAME })

    expect(row).toBeCollapsed()
    expect(queryByPlaceholderText(INPUT_PLACEHOLDER)).toBeNull()

    await user.press(row)

    expect(row).toBeExpanded()
    expect(queryByPlaceholderText(INPUT_PLACEHOLDER)).toBeTruthy()
  })

  test('renders server URL input with seeded value after expand', async () => {
    const user = userEvent.setup()
    const { getByPlaceholderText, getByRole } = await renderWithCtx()

    await user.press(getByRole('button', { name: ROW_BUTTON_NAME }))

    expect(getByPlaceholderText(INPUT_PLACEHOLDER)).toBeTruthy()
  })

  test('renders save button after expand', async () => {
    const user = userEvent.setup()
    const { getByRole } = await renderWithCtx()

    await user.press(getByRole('button', { name: ROW_BUTTON_NAME }))

    expect(getByRole('button', { name: SAVE_BUTTON_NAME })).toBeTruthy()
  })

  test('pressing save does not crash', async () => {
    const user = userEvent.setup()
    const { getByRole } = await renderWithCtx()

    await user.press(getByRole('button', { name: ROW_BUTTON_NAME }))
    await user.press(getByRole('button', { name: SAVE_BUTTON_NAME }))

    expect(getByRole('button', { name: SAVE_BUTTON_NAME })).toBeTruthy()
  })

  test('preserves the unsaved draft across collapse and reopen', async () => {
    const user = userEvent.setup()
    const { getByPlaceholderText, getByRole } = await renderWithCtx()
    const row = getByRole('button', { name: ROW_BUTTON_NAME })

    await user.press(row)
    const input = getByPlaceholderText(INPUT_PLACEHOLDER)
    await user.clear(input)
    await user.type(input, DRAFT_URL)

    await user.press(row)
    await user.press(row)

    expect(getByPlaceholderText(INPUT_PLACEHOLDER)).toHaveDisplayValue(DRAFT_URL)
  })
})
