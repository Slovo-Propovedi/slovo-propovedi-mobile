import { act, screen } from '@testing-library/react-native'
import { AppState, type AppStateStatus, StyleSheet } from 'react-native'
import { type GestureType } from 'react-native-gesture-handler'
import { type AudioPlayerData } from 'entities/sermon'
import { renderWithProviders } from 'shared/mocks/renderWithProviders'
import { keyboardBottomInsetSv } from 'shared/ui/layout'
import { LightTheme, RADIUSES } from 'shared/ui/theme'
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
  createGlassStyles: jest.requireActual('shared/ui/glass/glass').createGlassStyles,
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

const findContainerNode = () =>
  screen.root?.queryAll(instance => StyleSheet.flatten(instance.props.style)?.zIndex === 200)[0]

describe('<ContainerView> pointer events', () => {
  test('lets touches through the collapsed container so the mini pill receives them', async () => {
    await renderWithProviders(<ContainerView {...baseProps} expanded={false} />)

    expect(findContainerNode()?.props.pointerEvents).toBe('none')
  })

  test('captures touches once the container is expanded to fullscreen', async () => {
    await renderWithProviders(<ContainerView {...baseProps} expanded />)

    expect(findContainerNode()?.props.pointerEvents).toBe('auto')
  })
})

describe('<ContainerView> background artwork layers', () => {
  test('renders no surface overlay above the background artwork', async () => {
    // Regression: the legacy miniOverlay (theme.surface + RADIUSES.round, absoluteFill,
    // mounted above the artwork) painted an oval sheet over the expanding artwork
    // during the expand/collapse morph. It is dead at rest (container opacity 0) —
    // the layer must not exist at all.
    await renderWithProviders(<ContainerView {...baseProps} expanded={false} />)

    const overlayNodes = screen.root?.queryAll(
      instance => StyleSheet.flatten(instance.props.style)?.borderRadius === RADIUSES.round,
    )

    expect(overlayNodes ?? []).toHaveLength(0)
  })
})

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

  test('follows the keyboard while collapsed and stays put at fullscreen', async () => {
    keyboardBottomInsetSv.value = 200

    try {
      const { rerender } = await renderWithProviders(
        <ContainerView {...baseProps} expanded={false} />,
      )
      const findLift = () =>
        screen.root?.queryAll(instance => {
          const transform = StyleSheet.flatten(instance.props.style)?.transform

          return Array.isArray(transform) && transform.some(entry => 'translateY' in entry)
        })[0]

      expect(StyleSheet.flatten(findLift()?.props.style)?.transform).toEqual([{ translateY: -200 }])

      await rerender(<ContainerView {...baseProps} expanded />)

      expect(StyleSheet.flatten(findLift()?.props.style)?.transform).toEqual([{ translateY: 0 }])
    } finally {
      keyboardBottomInsetSv.value = 0
    }
  })
})
