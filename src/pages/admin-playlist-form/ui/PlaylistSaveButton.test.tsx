import { fireEvent } from '@testing-library/react-native'
import { renderWithProviders } from 'shared/mocks'
import { PlaylistSaveButton } from './PlaylistSaveButton'

describe('<PlaylistSaveButton>', () => {
  test('calls onPress when pressed', async () => {
    const onPress = jest.fn()

    const { getByText } = await renderWithProviders(
      <PlaylistSaveButton onPress={onPress} isSubmitting={false} />,
    )
    fireEvent.press(getByText('Сохранить'))

    expect(onPress).toHaveBeenCalledTimes(1)
  })

  test('hides the label while submitting', async () => {
    const { queryByText } = await renderWithProviders(
      <PlaylistSaveButton isSubmitting onPress={jest.fn()} />,
    )

    expect(queryByText('Сохранить')).toBeNull()
  })
})
