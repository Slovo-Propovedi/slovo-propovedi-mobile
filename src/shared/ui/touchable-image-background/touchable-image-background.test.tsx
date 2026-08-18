import { fireEvent, screen } from '@testing-library/react-native'
import { Text } from 'react-native'
import { renderWithProviders } from '../../mocks/renderWithProviders'
import { TouchableImageBackground } from './touchable-image-background'
import '@testing-library/jest-native/extend-expect'

describe('<TouchableImageBackground/>', () => {
  const mockOnPress = jest.fn()
  const testPreviewSrc = 'https://www.test-preview-src.com'

  test('renders correctly and calls onPress when pressed', async () => {
    await renderWithProviders(
      <TouchableImageBackground
        testID='touchable'
        onPress={mockOnPress}
        previewSrc={testPreviewSrc}
      >
        <Text>Test Child</Text>
      </TouchableImageBackground>,
    )

    fireEvent.press(screen.getByTestId('touchable'))
    expect(mockOnPress).toHaveBeenCalled()
  })

  test('displays the correct preview image', async () => {
    await renderWithProviders(
      <TouchableImageBackground onPress={mockOnPress} previewSrc={testPreviewSrc}>
        <Text>Test Child</Text>
      </TouchableImageBackground>,
    )

    const imageBackground = screen.getByTestId('image-background')
    expect(imageBackground).toHaveProp('source', { uri: testPreviewSrc })
  })

  test('applies style and imageStyle props correctly', async () => {
    await renderWithProviders(
      <TouchableImageBackground
        onPress={mockOnPress}
        previewSrc={testPreviewSrc}
        imageStyle={{ opacity: 0.5 }}
        style={{ backgroundColor: 'red' }}
      >
        <Text>Test Child</Text>
      </TouchableImageBackground>,
    )

    const imageBackground = screen.getByTestId('image-background')
    expect(imageBackground).toHaveStyle({ opacity: 0.5 })
    expect(imageBackground).toHaveStyle({ backgroundColor: 'red' })
  })

  test('displays child elements', async () => {
    await renderWithProviders(
      <TouchableImageBackground onPress={mockOnPress} previewSrc={testPreviewSrc}>
        <Text>Test Child</Text>
      </TouchableImageBackground>,
    )
    expect(screen.getByText('Test Child')).toBeTruthy()
  })
})
