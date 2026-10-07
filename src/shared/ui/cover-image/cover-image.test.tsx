import { screen } from '@testing-library/react-native'
import { Platform, View } from 'react-native'
import { APP_ICON_URI as IMAGE_PLACEHOLDER } from '../../lib/app-icon'
import { renderWithProviders } from '../../mocks/renderWithProviders'
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

  test('sets loading=lazy and priority=normal by default on native', async () => {
    await renderWithProviders(<CoverImage uri={URI_STUB} testID='cover' />)

    const image = screen.getByTestId('cover')
    expect(image.props.loading).toBe('lazy')
    expect(image.props.priority).toBe('normal')
  })

  test('sets loading=eager by default on web', async () => {
    const originalPlatform = Platform.OS
    Platform.OS = 'web'

    try {
      await renderWithProviders(<CoverImage uri={URI_STUB} testID='cover' />)

      expect(screen.getByTestId('cover').props.loading).toBe('eager')
    } finally {
      Platform.OS = originalPlatform
    }
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
