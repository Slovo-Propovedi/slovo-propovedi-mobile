import { fireEvent } from '@testing-library/react-native'
import { Linking } from 'react-native'
import { renderWithProviders } from 'shared/mocks/renderWithProviders'
import { YoutubePreview } from './YoutubePreview'

const TEST_URL = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
const TEST_PREVIEW_SRC = 'https://example.com/preview.jpg'

describe('<YoutubePreview>', () => {
  beforeEach(() => {
    jest.spyOn(Linking, 'openURL').mockImplementation(jest.fn())
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  test('renders the button', async () => {
    const { getByRole } = await renderWithProviders(
      <YoutubePreview url={TEST_URL} previewSrc={TEST_PREVIEW_SRC} />,
    )

    expect(getByRole('button')).toBeTruthy()
  })

  test('pressing the button opens the URL via Linking', async () => {
    const { getByRole } = await renderWithProviders(
      <YoutubePreview url={TEST_URL} previewSrc={TEST_PREVIEW_SRC} />,
    )

    fireEvent.press(getByRole('button'))

    expect(Linking.openURL).toHaveBeenCalledTimes(1)
  })

  test('pressing the button calls Linking.openURL with the exact url prop', async () => {
    const { getByRole } = await renderWithProviders(
      <YoutubePreview url={TEST_URL} previewSrc={TEST_PREVIEW_SRC} />,
    )

    fireEvent.press(getByRole('button'))

    expect(Linking.openURL).toHaveBeenCalledWith(TEST_URL)
  })
})
