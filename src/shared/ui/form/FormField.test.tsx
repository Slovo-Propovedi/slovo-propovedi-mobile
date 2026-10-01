import { fireEvent } from '@testing-library/react-native'
import { renderWithProviders } from '../../mocks'
import { COLORS } from '../theme/colors'
import { FormField } from './FormField'
import { FormSubmitContext } from './formSubmitContext'

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

  test('submits on Enter from a single-line field inside a form', async () => {
    const onSubmit = jest.fn()
    const { getByLabelText } = await renderWithProviders(
      <FormSubmitContext.Provider value={onSubmit}>
        <FormField value='' label='Название' onChangeText={jest.fn()} />
      </FormSubmitContext.Provider>,
    )

    expect(getByLabelText('Название').props.returnKeyType).toBe('done')
    fireEvent(getByLabelText('Название'), 'submitEditing')

    expect(onSubmit).toHaveBeenCalledTimes(1)
  })

  test('stays inert outside a form provider', async () => {
    const { getByLabelText } = await renderWithProviders(
      <FormField value='' label='Название' onChangeText={jest.fn()} />,
    )

    const input = getByLabelText('Название')
    expect(input.props.returnKeyType).toBeUndefined()
    expect(input.props.onSubmitEditing).toBeUndefined()

    fireEvent(input, 'submitEditing')
  })

  test('keeps newline behavior in a multiline field without submitting', async () => {
    const onSubmit = jest.fn()
    const { getByLabelText } = await renderWithProviders(
      <FormSubmitContext.Provider value={onSubmit}>
        <FormField value='' multiline label='Описание' onChangeText={jest.fn()} />
      </FormSubmitContext.Provider>,
    )

    fireEvent(getByLabelText('Описание'), 'submitEditing')

    expect(onSubmit).not.toHaveBeenCalled()
  })
})
