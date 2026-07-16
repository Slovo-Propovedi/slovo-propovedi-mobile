import { fireEvent, screen } from '@testing-library/react-native'
import '@testing-library/jest-native/extend-expect'
import { Text } from 'react-native'
import { renderWithProviders } from 'shared/mocks/renderWithProviders'
import { TouchableItem } from './touchable-item'

const childTextStub = 'Tap me'

describe('<TouchableItem>', () => {
  test('renders children correctly', async () => {
    await renderWithProviders(
      <TouchableItem onPress={jest.fn()}>
        <Text>{childTextStub}</Text>
      </TouchableItem>,
    )

    expect(screen.getByText(childTextStub)).toBeTruthy()
  })

  test('calls onPress when pressed', async () => {
    const onPressMock = jest.fn()

    await renderWithProviders(
      <TouchableItem onPress={onPressMock}>
        <Text>{childTextStub}</Text>
      </TouchableItem>,
    )

    fireEvent.press(screen.getByRole('button'))

    expect(onPressMock).toHaveBeenCalledTimes(1)
  })

  test('is disabled when disabled prop is true', async () => {
    await renderWithProviders(
      <TouchableItem disabled onPress={jest.fn()}>
        <Text>{childTextStub}</Text>
      </TouchableItem>,
    )

    expect(screen.getByRole('button')).toBeDisabled()
  })

  test('does not call onPress when disabled', async () => {
    const onPressMock = jest.fn()

    await renderWithProviders(
      <TouchableItem disabled onPress={onPressMock}>
        <Text>{childTextStub}</Text>
      </TouchableItem>,
    )

    fireEvent.press(screen.getByRole('button'))

    expect(onPressMock).not.toHaveBeenCalled()
  })
})
