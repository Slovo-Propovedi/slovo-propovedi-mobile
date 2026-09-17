import { render, screen } from '@testing-library/react-native'
import { Text } from 'react-native'
import { TouchableButton } from './TouchableButton'

describe('<TouchableButton>', () => {
  test('defaults to the button role', async () => {
    await render(
      <TouchableButton onPress={jest.fn()}>
        <Text>tap</Text>
      </TouchableButton>,
    )

    expect(screen.getByRole('button', { name: 'tap' })).toBeTruthy()
  })

  test('accepts an explicit role override', async () => {
    await render(
      <TouchableButton onPress={jest.fn()} accessibilityRole='link'>
        <Text>tap</Text>
      </TouchableButton>,
    )

    expect(screen.getByRole('link', { name: 'tap' })).toBeTruthy()
  })
})
