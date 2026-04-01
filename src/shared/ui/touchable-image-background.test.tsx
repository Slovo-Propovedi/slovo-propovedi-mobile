import { fireEvent, render } from '@testing-library/react-native'
import { Text } from 'react-native'
import { TouchableImageBackground } from './touchable-image-background'
import '@testing-library/jest-native/extend-expect'

describe('<TouchableImageBackground/>', () => {
  const mockOnPress = jest.fn()
  const testPreviewSrc = 'https://www.test-preview-src.com'

  test('renders correctly and calls onPress when pressed', () => {
    const { getByTestId } = render(
      <TouchableImageBackground
        testID='touchable'
        onPress={mockOnPress}
        previewSrc={testPreviewSrc}
      >
        <Text>Test Child</Text>
      </TouchableImageBackground>,
    )

    const touchable = getByTestId('touchable')
    fireEvent.press(touchable)
    expect(mockOnPress).toHaveBeenCalled()
  })

  test('displays the correct preview image', () => {
    const { getByTestId } = render(
      <TouchableImageBackground onPress={mockOnPress} previewSrc={testPreviewSrc}>
        <Text>Test Child</Text>
      </TouchableImageBackground>,
    )

    const imageBackground = getByTestId('image-background')

    expect(imageBackground).toHaveProp('source', { uri: testPreviewSrc })
  })

  test('applies style and imageStyle props correctly', () => {
    const { getByTestId } = render(
      <TouchableImageBackground
        onPress={mockOnPress}
        previewSrc={testPreviewSrc}
        imageStyle={{ opacity: 0.5 }}
        style={{ backgroundColor: 'red' }}
      >
        <Text>Test Child</Text>
      </TouchableImageBackground>,
    )

    const imageBackground = getByTestId('image-background')
    expect(imageBackground).toHaveProp('resizeMode', 'cover')
    expect(imageBackground).toHaveStyle({ opacity: 0.5 })
  })

  test('displays child elements', () => {
    const { getByText } = render(
      <TouchableImageBackground onPress={mockOnPress} previewSrc={testPreviewSrc}>
        <Text>Test Child</Text>
      </TouchableImageBackground>,
    )
    const childText = getByText('Test Child')
    expect(childText).toBeTruthy()
  })
})
