import { createCtx } from '@reatom/framework'
import { currentAudioAtom } from 'entities/player'
import { renderWithProviders } from 'shared/mocks'
import { type AudioPlayerData } from 'shared/model'
import { MarqueeText } from 'shared/ui'
import { NowPlayingLayer } from './NowPlayingLayer'

jest.mock('./PlayingWave', () => {
  const { View } = jest.requireActual('react-native')

  return {
    PlayingWave: () => <View testID='playing-wave' />,
  }
})

jest.mock('shared/ui', () => {
  const { Text } = jest.requireActual('react-native')

  return {
    MarqueeText: jest.fn(({ text }: { text: string }) => <Text>{text}</Text>),
  }
})

jest.mock('entities/player', () => {
  const { atom } = jest.requireActual('@reatom/framework')

  return {
    currentAudioAtom: atom(null, 'currentAudioAtom'),
  }
})

const makeAudio = (title: string): AudioPlayerData => ({
  artist: 'Author',
  artwork: 'artwork.jpg',
  audioUrl: 'https://example.com/audio.mp3',
  id: 'audio-1',
  title,
})

describe('<NowPlayingLayer>', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('renders the wave and the label', async () => {
    const { getByTestId, getByText } = await renderWithProviders(<NowPlayingLayer />)

    expect(getByTestId('playing-wave')).toBeTruthy()
    expect(getByText('Воспроизводится')).toBeTruthy()
  })

  test('renders the current audio title under the label', async () => {
    const ctx = createCtx()
    currentAudioAtom(ctx, makeAudio('Проповедь о надежде'))

    const { getByText } = await renderWithProviders(<NowPlayingLayer />, { ctx })

    expect(getByText('Воспроизводится')).toBeTruthy()
    expect(getByText('Проповедь о надежде')).toBeTruthy()
    expect(jest.mocked(MarqueeText).mock.calls[0][0]).toEqual(
      expect.objectContaining({ text: 'Проповедь о надежде' }),
    )
  })

  test('does not render the title line when no audio is playing', async () => {
    const { getByText } = await renderWithProviders(<NowPlayingLayer />)

    expect(getByText('Воспроизводится')).toBeTruthy()
    expect(jest.mocked(MarqueeText)).not.toHaveBeenCalled()
  })
})
