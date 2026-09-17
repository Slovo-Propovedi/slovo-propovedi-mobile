import { fireEvent, render, screen } from '@testing-library/react-native'
import { Text } from 'react-native'
import { TouchableItem } from './touchable-item'

const childTextStub = 'Tap me'

describe('<TouchableItem>', () => {
  test('renders children correctly', async () => {
    await render(
      <TouchableItem onPress={jest.fn()}>
        <Text>{childTextStub}</Text>
      </TouchableItem>,
    )

    expect(screen.getByText(childTextStub)).toBeTruthy()
  })

  test('calls onPress when pressed', async () => {
    const onPressMock = jest.fn()

    await render(
      <TouchableItem onPress={onPressMock}>
        <Text>{childTextStub}</Text>
      </TouchableItem>,
    )

    await fireEvent.press(screen.getByRole('button'))

    expect(onPressMock).toHaveBeenCalledTimes(1)
  })

  test('is disabled when disabled prop is true', async () => {
    await render(
      <TouchableItem disabled onPress={jest.fn()}>
        <Text>{childTextStub}</Text>
      </TouchableItem>,
    )

    expect(screen.getByRole('button')).toBeDisabled()
  })

  test('does not call onPress when disabled', async () => {
    const onPressMock = jest.fn()

    await render(
      <TouchableItem disabled onPress={onPressMock}>
        <Text>{childTextStub}</Text>
      </TouchableItem>,
    )

    await fireEvent.press(screen.getByRole('button'))

    expect(onPressMock).not.toHaveBeenCalled()
  })
})
