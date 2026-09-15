import { act, fireEvent } from '@testing-library/react-native'
import { currentAudioAtom, isPlayerExpandedAtom } from 'entities/player'
import { ctx } from 'shared/lib/reatom-ctx'
import { renderWithProviders } from 'shared/mocks/renderWithProviders'
import { isTabBarMeasuredAtom } from 'shared/ui/layout'
import { ExpandablePlayer } from './ExpandablePlayer'

const mockTogglePlay = jest.fn().mockResolvedValue(undefined)

jest.mock('entities/player', () => {
  const { action, atom } = jest.requireActual('@reatom/framework')
  return {
    closePlayerSheetAction: action(() => {}, 'mockClosePlayerSheetAction'),
    currentAudioAtom: atom(null, 'mockCurrentAudioAtom'),
    currentPlaylistAtom: atom(null, 'mockCurrentPlaylistAtom'),
    isBufferingAtom: atom(false, 'mockIsBufferingAtom'),
    isPlayerExpandedAtom: atom(false, 'mockIsPlayerExpandedAtom'),
    isPlayingAtom: atom(false, 'mockIsPlayingAtom'),
    openPlayerSheetAction: action(() => {}, 'mockOpenPlayerSheetAction'),
    useGuardedTogglePlay: () => ({ togglePlay: mockTogglePlay }),
  }
})

jest.mock('shared/ui/layout', () => {
  const { atom } = jest.requireActual('@reatom/framework')
  return {
    isTabBarMeasuredAtom: atom(true, 'mockIsTabBarMeasuredAtom'),
    tabBarHeightAtom: atom(0, 'mockTabBarHeightAtom'),
  }
})

jest.mock('../../model/showMenuAtom', () => {
  const { atom } = jest.requireActual('@reatom/framework')
  return { showMenuAtom: atom(false, 'mockShowMenuAtom') }
})

jest.mock('../../model/useBackgroundRecovery', () => ({
  useBackgroundRecovery: () => 'test-recovery-key',
}))

jest.mock('../../model/useContainerGeometryGuard', () => ({
  useContainerGeometryGuard: () => ({ onLayout: jest.fn() }),
}))

jest.mock('../../model/useExpandAnimation', () => ({
  useExpandAnimation: () => ({
    backdropStyle: {},
    backgroundImageStyle: {},
    collapsedRestingContainerStyle: { top: 0 },
    containerStyle: {},
    forceGeometryReapply: jest.fn(),
    fullStyle: {},
    miniOverlayStyle: {},
    miniStyle: {},
    progress: { value: 0 },
    restingContainerStyle: {},
    screenHeight: 800,
    screenWidth: 400,
  }),
}))

jest.mock('./useExpandablePlayerGesture', () => ({
  useExpandablePlayerGesture: () => ({
    handleCloseFullscreen: jest.fn(),
    handleMiniTap: jest.fn(),
    miniPan: {},
    panGesture: {},
  }),
}))

jest.mock('./ContainerView', () => ({
  ContainerView: () => null,
}))

jest.mock('./styles', () => ({ createStyles: () => ({}) }))
jest.mock('./miniStyles', () => ({ createMiniStyles: () => ({}) }))

jest.mock('./MiniPlayer', () => {
  const { Pressable } = jest.requireActual('react-native')
  return {
    MiniPlayer: ({ onPlayPause }: { onPlayPause: () => void }) => (
      <Pressable onPress={onPlayPause} accessibilityRole='button' accessibilityLabel='play-pause' />
    ),
  }
})

const AUDIO_URL = 'https://example.com/audio.mp3'

const mockAudio = {
  artist: 'Author',
  artwork: null,
  audioUrl: AUDIO_URL,
  id: 'sermon-1',
  title: 'Test Sermon',
}

describe('<ExpandablePlayer>', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockTogglePlay.mockResolvedValue(undefined)
    currentAudioAtom(ctx, mockAudio)
    isPlayerExpandedAtom(ctx, false)
    isTabBarMeasuredAtom(ctx, true)
  })

  test('mini-player play/pause press delegates to useGuardedTogglePlay', async () => {
    const { getByLabelText } = await renderWithProviders(<ExpandablePlayer />, { ctx })

    await act(async () => {
      fireEvent.press(getByLabelText('play-pause'))
    })

    expect(mockTogglePlay).toHaveBeenCalledTimes(1)
  })
})
