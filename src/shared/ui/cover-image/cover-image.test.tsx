import { screen } from '@testing-library/react-native'
import { View } from 'react-native'
import '@testing-library/jest-native/extend-expect'
import { renderWithProviders } from '../../mocks/renderWithProviders'
import { IMAGE_PLACEHOLDER } from '../images'
import { CoverImage } from './cover-image'

const URI_STUB = 'https://example.com/image.jpg'

describe('<CoverImage>', () => {
  test('renders and forwards source uri', async () => {
    await renderWithProviders(<CoverImage uri={URI_STUB} testID='cover' />)

    const image = screen.getByTestId('cover')
    expect(image).toBeTruthy()
    expect(image.props.source).toEqual({ uri: URI_STUB })
    expect(image.props.cachePolicy).toBe('memory-disk')
    expect(image.props.contentFit).toBe('cover')
    expect(image.props.transition).toBe(200)
  })

  test('falls back to IMAGE_PLACEHOLDER when uri is undefined', async () => {
    await renderWithProviders(<CoverImage testID='cover' />)

    const image = screen.getByTestId('cover')
    expect(image.props.source).toEqual({ uri: IMAGE_PLACEHOLDER })
  })

  test('sets loading=eager and priority=high when eager=true', async () => {
    await renderWithProviders(<CoverImage eager uri={URI_STUB} testID='cover' />)

    const image = screen.getByTestId('cover')
    expect(image.props.loading).toBe('eager')
    expect(image.props.priority).toBe('high')
  })

  test('sets loading=lazy and priority=normal by default', async () => {
    await renderWithProviders(<CoverImage uri={URI_STUB} testID='cover' />)

    const image = screen.getByTestId('cover')
    expect(image.props.loading).toBe('lazy')
    expect(image.props.priority).toBe('normal')
  })

  test('renders children over the image', async () => {
    await renderWithProviders(
      <CoverImage uri={URI_STUB} testID='cover'>
        <View testID='child' />
      </CoverImage>,
    )

    expect(screen.getByTestId('child')).toBeTruthy()
  })

  test('passes testID through', async () => {
    await renderWithProviders(<CoverImage uri={URI_STUB} testID='my-cover' />)

    expect(screen.getByTestId('my-cover')).toBeTruthy()
  })
})
