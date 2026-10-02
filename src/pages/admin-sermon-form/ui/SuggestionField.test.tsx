import { act, fireEvent, waitFor } from '@testing-library/react-native'
import { type TestInstance } from 'test-renderer'
import { renderWithProviders } from 'shared/mocks'
import { SuggestionField } from './SuggestionField'

const OPTIONS = ['Иоанн', 'Павел', 'Пётр']
const FIELD_LABEL = 'Проповедник'

const renderField = (
  overrides: {
    onChangeText?: (text: string) => void
    options?: string[]
    value?: string
  } = {},
) =>
  renderWithProviders(
    <SuggestionField
      value=''
      options={OPTIONS}
      label={FIELD_LABEL}
      onChangeText={jest.fn()}
      {...overrides}
    />,
  )

const focusField = (getByLabelText: (label: string) => TestInstance) =>
  act(async () => {
    fireEvent(getByLabelText(FIELD_LABEL), 'focus')
  })

describe('<SuggestionField>', () => {
  test('shows suggestions on focus with an empty value', async () => {
    const { getByLabelText, getByRole, queryByText } = await renderField()

    expect(queryByText('Иоанн')).toBeNull()

    await focusField(getByLabelText)

    expect(getByRole('button', { name: 'Иоанн' })).toBeTruthy()
    expect(getByRole('button', { name: 'Павел' })).toBeTruthy()
    expect(getByRole('button', { name: 'Пётр' })).toBeTruthy()
  })

  test('caps the suggestion list at ten items', async () => {
    const options = Array.from({ length: 12 }, (_, index) => `Автор ${index + 1}`)
    const { getByLabelText, getByText, queryByText } = await renderField({ options })

    await focusField(getByLabelText)

    expect(getByText('Автор 10')).toBeTruthy()
    expect(queryByText('Автор 11')).toBeNull()
  })

  test('fills the field when a suggestion is pressed', async () => {
    const onChangeText = jest.fn()
    const { getByLabelText, getByRole } = await renderField({ onChangeText })

    await focusField(getByLabelText)
    fireEvent.press(getByRole('button', { name: 'Павел' }))

    expect(onChangeText).toHaveBeenCalledWith('Павел')
  })

  test('filters suggestions by the typed value', async () => {
    const { getByLabelText, getByRole, queryByText } = await renderField({ value: 'Па' })

    await focusField(getByLabelText)

    expect(getByRole('button', { name: 'Павел' })).toBeTruthy()
    expect(queryByText('Иоанн')).toBeNull()
    expect(queryByText('Пётр')).toBeNull()
  })

  test('hides suggestions after blur', async () => {
    const { getByLabelText, getByText, queryByText } = await renderField()

    await focusField(getByLabelText)
    expect(getByText('Иоанн')).toBeTruthy()

    await act(async () => {
      fireEvent(getByLabelText(FIELD_LABEL), 'blur')
    })

    await waitFor(() => expect(queryByText('Иоанн')).toBeNull())
  })
})
