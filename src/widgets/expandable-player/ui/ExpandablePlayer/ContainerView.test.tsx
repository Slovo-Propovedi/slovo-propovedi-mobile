import { act } from '@testing-library/react-native'
import { AppState, type AppStateStatus } from 'react-native'
import { renderWithProviders } from 'shared/mocks/renderWithProviders'
import { LightTheme } from 'shared/ui/theme'
import type { GestureType } from 'react-native-gesture-handler'
import type { AudioPlayerData } from 'shared/model'
import { COLLAPSE_DURATION_MS } from '../../model/expandDurations'
import { ContainerView } from './ContainerView'
import { createStyles } from './styles'

jest.mock('../FullscreenContent/FullscreenContent', () => {
  const { Text } = jest.requireActual('react-native')
  return {
    FullscreenContent: () => <Text testID='fullscreen-content'>fullscreen</Text>,
  }
})

jest.mock('shared/ui', () => ({
  CoverImage: () => null,
}))

jest.mock('expo-status-bar', () => ({
  StatusBar: () => null,
}))

const FULLSCREEN_TEST_ID = 'fullscreen-content'
const AUDIO_URL = 'https://example.com/audio.mp3'

const AUDIO: AudioPlayerData = {
  artist: 'Автор',
  artwork: null,
  audioUrl: AUDIO_URL,
  id: 'sermon-1',
  title: 'Тестовая проповедь',
}

const baseProps = {
  audio: AUDIO,
  backgroundImageStyle: {},
  closeFullscreen: jest.fn(),
  containerStyle: {},
  currentTheme: LightTheme,
  expanded: false,
  fullStyle: {},
  miniOverlay: {},
  miniOverlayStyle: {},
  onLayout: jest.fn(),
  panGesture: {} as GestureType,
  restingContainerStyle: {},
  styles: createStyles(LightTheme),
}

const mockListeners: Array<(state: AppStateStatus) => void> = []

beforeEach(() => {
  mockListeners.length = 0
  jest.spyOn(AppState, 'addEventListener').mockImplementation((_event, listener) => {
    mockListeners.push(listener)
    return {
      remove: () => {
        const index = mockListeners.indexOf(listener)
        if (index >= 0) mockListeners.splice(index, 1)
      },
    }
  })
})

afterEach(() => {
  jest.useRealTimers()
  jest.restoreAllMocks()
})

const emitState = (state: AppStateStatus) => {
  for (const listener of mockListeners) listener(state)
}

describe('<ContainerView> fullscreen gating', () => {
  test('keeps FullscreenContent mounted during the collapse window, then unmounts', async () => {
    jest.useFakeTimers({ doNotFake: ['setImmediate'] })
    const { getByTestId, queryByTestId, rerender } = await renderWithProviders(
      <ContainerView {...baseProps} expanded />,
    )
    expect(getByTestId(FULLSCREEN_TEST_ID)).toBeTruthy()

    await rerender(<ContainerView {...baseProps} expanded={false} />)
    expect(getByTestId(FULLSCREEN_TEST_ID)).toBeTruthy()

    await act(async () => {
      jest.advanceTimersByTime(COLLAPSE_DURATION_MS)
    })
    expect(queryByTestId(FULLSCREEN_TEST_ID)).toBeNull()
  })

  test('unmounts FullscreenContent only after COLLAPSE_DURATION_MS', async () => {
    jest.useFakeTimers({ doNotFake: ['setImmediate'] })
    const { getByTestId, queryByTestId, rerender } = await renderWithProviders(
      <ContainerView {...baseProps} expanded />,
    )
    await rerender(<ContainerView {...baseProps} expanded={false} />)

    await act(async () => {
      jest.advanceTimersByTime(COLLAPSE_DURATION_MS - 1)
    })
    expect(getByTestId(FULLSCREEN_TEST_ID)).toBeTruthy()

    await act(async () => {
      jest.advanceTimersByTime(1)
    })
    expect(queryByTestId(FULLSCREEN_TEST_ID)).toBeNull()
  })

  test('re-expanding during the collapse window cancels the pending unmount', async () => {
    jest.useFakeTimers({ doNotFake: ['setImmediate'] })
    const { getByTestId, rerender } = await renderWithProviders(
      <ContainerView {...baseProps} expanded />,
    )
    await rerender(<ContainerView {...baseProps} expanded={false} />)
    await rerender(<ContainerView {...baseProps} expanded />)

    await act(async () => {
      jest.advanceTimersByTime(COLLAPSE_DURATION_MS * 2)
    })
    expect(getByTestId(FULLSCREEN_TEST_ID)).toBeTruthy()
  })

  test('snaps the mount flag immediately when AppState resumes while collapsed', async () => {
    jest.useFakeTimers({ doNotFake: ['setImmediate'] })
    const { getByTestId, queryByTestId, rerender } = await renderWithProviders(
      <ContainerView {...baseProps} expanded />,
    )
    await rerender(<ContainerView {...baseProps} expanded={false} />)
    expect(getByTestId(FULLSCREEN_TEST_ID)).toBeTruthy()

    await act(async () => {
      emitState('active')
    })
    expect(queryByTestId(FULLSCREEN_TEST_ID)).toBeNull()

    await act(async () => {
      jest.advanceTimersByTime(COLLAPSE_DURATION_MS * 2)
    })
    expect(queryByTestId(FULLSCREEN_TEST_ID)).toBeNull()
  })

  test('renders non-fullscreen layers while collapsed (MiniPlayer path unaffected)', async () => {
    const { queryByTestId } = await renderWithProviders(
      <ContainerView {...baseProps} expanded={false} />,
    )
    expect(queryByTestId(FULLSCREEN_TEST_ID)).toBeNull()
  })
})
