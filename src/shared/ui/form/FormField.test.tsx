import { fireEvent } from '@testing-library/react-native'
import { renderWithProviders } from '../../mocks'
import { COLORS } from '../theme/colors'
import { FormField } from './FormField'

describe('<FormField>', () => {
  test('renders a required marker after the label', async () => {
    const { getByText } = await renderWithProviders(
      <FormField required value='' label='Название' onChangeText={jest.fn()} />,
    )

    expect(getByText('Название', { exact: false })).toBeTruthy()
    expect(getByText('*')).toBeTruthy()
  })

  test('does not render a marker for an optional field', async () => {
    const { queryByText } = await renderWithProviders(
      <FormField value='' label='Описание' onChangeText={jest.fn()} />,
    )

    expect(queryByText('*')).toBeNull()
  })

  test('paints the input border red when invalid', async () => {
    const { getByLabelText } = await renderWithProviders(
      <FormField invalid required value='' label='Название' onChangeText={jest.fn()} />,
    )

    expect(getByLabelText('Название')).toHaveStyle({
      borderColor: COLORS.error,
      borderWidth: 2,
    })
  })

  test('calls onBlur when the input loses focus', async () => {
    const onBlur = jest.fn()
    const { getByLabelText } = await renderWithProviders(
      <FormField required value='' onBlur={onBlur} label='Название' onChangeText={jest.fn()} />,
    )

    fireEvent(getByLabelText('Название'), 'blur')

    expect(onBlur).toHaveBeenCalledTimes(1)
  })
})
