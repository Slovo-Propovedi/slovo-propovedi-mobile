import { fireEvent } from '@testing-library/react-native'
import { type AudioPlayer, type AudioStatus } from 'expo-audio'
import { Linking } from 'react-native'
import { renderWithProviders } from 'shared/mocks'
import { SermonMediaCard } from './SermonMediaCard'

// The screen owns the expo-audio player; the card only hands it to the preview.
// These tests exercise links, so a minimal structurally valid stub is enough.
const player = { pause: jest.fn(), play: jest.fn(), seekTo: jest.fn() } as unknown as AudioPlayer
const status = {
  currentTime: 0,
  duration: 0,
  playing: false,
} as unknown as AudioStatus

// The preview imports PlayerProgressBar from 'entities/player', whose barrel
// pulls the native expo-audio module at load; Jest cannot instantiate it.
jest.mock('expo-audio', () => ({}))

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
        player={player}
        status={status}
        textFileUrl={null}
        youtubeUrl='https://www.youtube.com/watch?v=abc'
      />,
    )

    await fireEvent.press(await findByText('Смотреть на YouTube'))

    expect(openURL).toHaveBeenCalledWith('https://www.youtube.com/watch?v=abc')
  })

  test('never opens a text link outside the storage', async () => {
    const { findByText } = await renderWithProviders(
      <SermonMediaCard
        audioUrl={null}
        player={player}
        status={status}
        youtubeUrl={null}
        textFileUrl='javascript:alert(1)'
      />,
    )

    await fireEvent.press(await findByText('Открыть текст проповеди'))

    expect(openURL).not.toHaveBeenCalled()
  })

  test.each(['javascript:alert(1)', 'data:text/html,<script>1</script>'])(
    'never opens a stored non-http(s) link %p',
    async youtubeUrl => {
      const { findByText } = await renderWithProviders(
        <SermonMediaCard
          audioUrl={null}
          player={player}
          status={status}
          textFileUrl={null}
          youtubeUrl={youtubeUrl}
        />,
      )

      await fireEvent.press(await findByText('Смотреть на YouTube'))

      expect(openURL).not.toHaveBeenCalled()
    },
  )
})
