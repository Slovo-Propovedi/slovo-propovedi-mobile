import { fireEvent, waitFor } from '@testing-library/react-native'
import { type AudioPlayer, type AudioStatus } from 'expo-audio'
import { mockConsole, renderWithProviders } from 'shared/mocks'
import { SermonAudioPreview } from './SermonAudioPreview'

interface ProgressBarProps {
  duration: number
  onSeek: (position: number) => void
  position: number
}

const mockPlayerProgressBar = jest.fn()

jest.mock('entities/player', () => ({
  PlayerProgressBar: (props: ProgressBarProps) => {
    mockPlayerProgressBar(props)
    return null
  },
}))

const PLAY_LABEL = 'Воспроизвести'
const PAUSE_LABEL = 'Пауза'
const CURRENT_TIME_SECONDS = 12
const DURATION_SECONDS = 300
const SEEK_MS = 5000
const SEEK_SECONDS = 5

interface MockPlayerMethods {
  pause: jest.Mock
  play: jest.Mock
  seekTo: jest.Mock
}

// expo-audio's AudioPlayer is a native class instance; the preview only calls
// these three methods, so a single cast at this factory keeps every test typed.
const buildMockPlayer = (): AudioPlayer & MockPlayerMethods =>
  ({
    pause: jest.fn(),
    play: jest.fn(),
    seekTo: jest.fn().mockResolvedValue(undefined),
  }) as unknown as AudioPlayer & MockPlayerMethods

const buildStatus = (overrides: Partial<AudioStatus> = {}): AudioStatus =>
  ({
    currentTime: CURRENT_TIME_SECONDS,
    duration: DURATION_SECONDS,
    playing: false,
    ...overrides,
  }) as unknown as AudioStatus

const renderPreview = (player: AudioPlayer, status = buildStatus()) =>
  renderWithProviders(<SermonAudioPreview status={status} player={player} />)

const getProgressBarProps = (): ProgressBarProps => {
  const props = mockPlayerProgressBar.mock.calls[0]?.[0]

  if (!props) throw new Error('PlayerProgressBar was not rendered')

  return props
}

describe('<SermonAudioPreview>', () => {
  beforeEach(() => {
    mockPlayerProgressBar.mockClear()
  })

  test('plays and pauses through the injected player', async () => {
    const player = buildMockPlayer()
    const { getByRole, rerender } = await renderPreview(player)

    await fireEvent.press(getByRole('button', { name: PLAY_LABEL }))
    expect(player.play).toHaveBeenCalledTimes(1)

    await rerender(<SermonAudioPreview player={player} status={buildStatus({ playing: true })} />)

    await fireEvent.press(getByRole('button', { name: PAUSE_LABEL }))
    expect(player.pause).toHaveBeenCalledTimes(1)
  })

  test('feeds millisecond progress and seeks in seconds', async () => {
    const player = buildMockPlayer()
    await renderPreview(player)

    const props = getProgressBarProps()

    expect(props.duration).toBe(DURATION_SECONDS * 1000)
    expect(props.position).toBe(CURRENT_TIME_SECONDS * 1000)

    props.onSeek(SEEK_MS)
    expect(player.seekTo).toHaveBeenCalledWith(SEEK_SECONDS)
  })

  test('reports a failed seek without crashing', async () => {
    const { error: consoleError } = mockConsole('error')
    const player = buildMockPlayer()
    player.seekTo.mockRejectedValueOnce(new Error('seek failed'))
    await renderPreview(player)

    getProgressBarProps().onSeek(SEEK_MS)

    await waitFor(() =>
      expect(consoleError).toHaveBeenCalledWith(
        '[SermonAudioPreview] seek failed:',
        expect.any(Error),
      ),
    )
  })
})
