import { fireEvent, render } from '@testing-library/react-native'
import { type AudioPlayerData } from 'entities/sermon'
import { hapticLight } from 'shared/lib/haptics'
import { LightTheme } from 'shared/ui/theme'
import { createStyles } from '../ExpandablePlayer/styles'
import { PlayerMiddleArea } from './PlayerMiddleArea'

jest.mock('shared/lib/haptics', () => ({ hapticLight: jest.fn() }))

jest.mock('shared/ui', () => ({ CoverImage: () => null }))

jest.mock('./PlayerEdgeSeekZones', () => ({ PlayerEdgeSeekZones: () => null }))

jest.mock('./DetailsOverlay', () => ({ DetailsOverlay: () => null }))

const mockedHapticLight = jest.mocked(hapticLight)

const AUDIO: AudioPlayerData = {
  artist: 'Автор',
  artwork: null,
  audioUrl: 'https://example.com/audio.mp3',
  id: 'sermon-1',
  title: 'Тестовая проповедь',
}

const START = { pageX: 100, pageY: 300 }

const renderMiddleArea = ({ onTogglePlay }: { onTogglePlay: () => void }) =>
  render(
    <PlayerMiddleArea
      audio={AUDIO}
      insetsTop={0}
      showDetails={false}
      tapSeek={jest.fn()}
      stopSeek={jest.fn()}
      startSeek={jest.fn()}
      onCloseDetails={jest.fn()}
      onTogglePlay={onTogglePlay}
      styles={createStyles(LightTheme)}
    />,
  )

describe('<PlayerMiddleArea> tap-to-toggle', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('swallows a press whose pointer drifted with a swipe', async () => {
    const onTogglePlay = jest.fn()

    const { getByTestId } = await renderMiddleArea({ onTogglePlay })
    const surface = getByTestId('player-middle-area-tap')

    await fireEvent(surface, 'pressIn', { nativeEvent: START })
    await fireEvent(surface, 'press', { nativeEvent: { pageX: 100, pageY: 400 } })

    expect(onTogglePlay).not.toHaveBeenCalled()
    expect(mockedHapticLight).not.toHaveBeenCalled()
  })

  test('toggles playback and haptics on a completed tap', async () => {
    const onTogglePlay = jest.fn()

    const { getByTestId } = await renderMiddleArea({ onTogglePlay })
    const surface = getByTestId('player-middle-area-tap')

    await fireEvent(surface, 'pressIn', { nativeEvent: START })
    await fireEvent(surface, 'press', { nativeEvent: START })

    expect(onTogglePlay).toHaveBeenCalledTimes(1)
    expect(mockedHapticLight).toHaveBeenCalledTimes(1)
  })
})
