import { createCtx } from '@reatom/framework'
import { fireEvent } from '@testing-library/react-native'
import { serverUrlAtom } from 'entities/settings'
import { renderWithProviders } from 'shared/mocks'
import '@testing-library/jest-native/extend-expect'
import { ServerUrlSettings } from './ServerUrlSettings'

const TEST_URL = 'https://test.example.com'
const SAVE_BUTTON_ID = 'save-server-url'

jest.mock('shared/api/axiosInstance', () => ({
  axiosInstance: { defaults: { baseURL: TEST_URL } },
}))

describe('<ServerUrlSettings>', () => {
  test('renders server URL input with seeded value', async () => {
    const ctx = createCtx()
    serverUrlAtom(ctx, TEST_URL)
    const { getByTestId } = await renderWithProviders(<ServerUrlSettings />, { ctx })
    expect(getByTestId('server-url-input')).toBeTruthy()
  })

  test('renders save button', async () => {
    const ctx = createCtx()
    serverUrlAtom(ctx, TEST_URL)
    const { getByTestId } = await renderWithProviders(<ServerUrlSettings />, { ctx })
    expect(getByTestId(SAVE_BUTTON_ID)).toBeTruthy()
  })

  test('pressing save does not crash', async () => {
    const ctx = createCtx()
    serverUrlAtom(ctx, TEST_URL)
    const { getByTestId } = await renderWithProviders(<ServerUrlSettings />, { ctx })
    fireEvent.press(getByTestId(SAVE_BUTTON_ID))
    expect(getByTestId(SAVE_BUTTON_ID)).toBeTruthy()
  })
})
