import { fireEvent, render, screen } from '@testing-library/react-native'
import { impactAsync } from 'expo-haptics'
import { Text } from 'react-native'
import { TouchableButton } from './TouchableButton'

const mockedImpactAsync = impactAsync as jest.MockedFunction<typeof impactAsync>

describe('<TouchableButton>', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

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

  test('disabled button does not trigger haptics on press-in', async () => {
    await render(
      <TouchableButton disabled onPress={jest.fn()}>
        <Text>tap</Text>
      </TouchableButton>,
    )

    fireEvent(screen.getByRole('button', { name: 'tap' }), 'pressIn')

    expect(mockedImpactAsync).not.toHaveBeenCalled()
  })
})
