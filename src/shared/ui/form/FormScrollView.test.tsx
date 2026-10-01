import { fireEvent } from '@testing-library/react-native'
import { Pressable, Text } from 'react-native'
import { renderWithProviders } from '../../mocks'
import { FormScrollView } from './FormScrollView'
import { useFormSubmit } from './formSubmitContext'

const SubmitConsumer = () => {
  const onSubmit = useFormSubmit()

  return (
    <Pressable onPress={() => onSubmit?.()} accessibilityLabel='invoke-submit'>
      <Text>{onSubmit ? 'wired' : 'inert'}</Text>
    </Pressable>
  )
}

describe('<FormScrollView>', () => {
  test('publishes onSubmit to child fields', async () => {
    const onSubmit = jest.fn()
    const { getByLabelText, getByText } = await renderWithProviders(
      <FormScrollView onSubmit={onSubmit}>
        <SubmitConsumer />
      </FormScrollView>,
    )

    expect(getByText('wired')).toBeTruthy()
    fireEvent.press(getByLabelText('invoke-submit'))

    expect(onSubmit).toHaveBeenCalledTimes(1)
  })

  test('leaves the submit context empty without onSubmit', async () => {
    const { getByText } = await renderWithProviders(
      <FormScrollView>
        <SubmitConsumer />
      </FormScrollView>,
    )

    expect(getByText('inert')).toBeTruthy()
  })
})
