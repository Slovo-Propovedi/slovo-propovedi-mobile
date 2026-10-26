import { fireEvent } from '@testing-library/react-native'
import { Linking } from 'react-native'
import { renderWithProviders } from 'shared/mocks'
import { SermonMediaCard } from './SermonMediaCard'

// expo-audio pulls in a native module that throws at import in Jest; the card
// imports the audio preview even when no audio is rendered.
jest.mock('expo-audio', () => ({
  useAudioPlayer: () => ({ pause: jest.fn(), play: jest.fn() }),
  useAudioPlayerStatus: () => ({ currentTime: 0, duration: 0, playing: false }),
}))

describe('<SermonMediaCard>', () => {
  let openURL: jest.SpyInstance

  beforeEach(() => {
    openURL = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined)
  })

  afterEach(() => {
    openURL.mockRestore()
  })

  test('opens an https media link', async () => {
    const { findByText } = await renderWithProviders(
      <SermonMediaCard
        audioUrl={null}
        textFileUrl={null}
        youtubeUrl='https://www.youtube.com/watch?v=abc'
      />,
    )

    await fireEvent.press(await findByText('Смотреть на YouTube'))

    expect(openURL).toHaveBeenCalledWith('https://www.youtube.com/watch?v=abc')
  })

  test('never opens a text link outside the storage', async () => {
    const { findByText } = await renderWithProviders(
      <SermonMediaCard audioUrl={null} youtubeUrl={null} textFileUrl='javascript:alert(1)' />,
    )

    await fireEvent.press(await findByText('Открыть текст проповеди'))

    expect(openURL).not.toHaveBeenCalled()
  })

  test.each(['javascript:alert(1)', 'data:text/html,<script>1</script>'])(
    'never opens a stored non-http(s) link %p',
    async youtubeUrl => {
      const { findByText } = await renderWithProviders(
        <SermonMediaCard audioUrl={null} textFileUrl={null} youtubeUrl={youtubeUrl} />,
      )

      await fireEvent.press(await findByText('Смотреть на YouTube'))

      expect(openURL).not.toHaveBeenCalled()
    },
  )
})
