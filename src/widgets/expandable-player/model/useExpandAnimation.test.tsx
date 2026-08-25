import { act } from '@testing-library/react-native'
import { Text } from 'react-native'
import { AppState, type AppStateStatus } from 'react-native'
import { withTiming } from 'react-native-reanimated'
import { renderWithProviders } from 'shared/mocks/renderWithProviders'
import { INDENTS, PLAYER_SIZES, RADIUSES } from 'shared/ui/theme'
import { useExpandAnimation } from './useExpandAnimation'

const mockedWithTiming = withTiming as jest.Mock

jest.mock('react-native/Libraries/Utilities/useWindowDimensions', () => ({
  __esModule: true,
  default: () => ({ fontScale: 1, height: 800, width: 400 }),
}))

jest.mock('react-native/Libraries/Utilities/Dimensions', () => ({
  __esModule: true,
  default: {
    addEventListener: jest.fn(),
    get: () => ({ height: 800, width: 400 }),
    removeEventListener: jest.fn(),
  },
}))

const mockListeners: Array<(state: AppStateStatus) => void> = []

beforeEach(() => {
  mockListeners.length = 0
  jest
    .spyOn(AppState, 'addEventListener')
    .mockImplementation((_event: string, listener: (state: AppStateStatus) => void) => {
      mockListeners.push(listener)
      return { remove: jest.fn() }
    })
})

afterEach(() => {
  jest.restoreAllMocks()
})

const emitState = (state: AppStateStatus) => {
  for (const listener of mockListeners) listener(state)
}

// Capture progress shared value from the hook via a component that also
// renders it as text so we can re-render and re-read after state changes
const CollapsedHarness = ({ onProgress }: { onProgress: (p: { value: number }) => void }) => {
  const { progress } = useExpandAnimation(false, 56)
  onProgress(progress)
  return <Text testID='harness'>{String(progress.value)}</Text>
}

const ExpandedHarness = ({ onProgress }: { onProgress: (p: { value: number }) => void }) => {
  const { progress } = useExpandAnimation(true, 56)
  onProgress(progress)
  return <Text testID='harness'>{String(progress.value)}</Text>
}

describe('useExpandAnimation foreground snap', () => {
  let capturedProgress: { value: number }

  const trackProgress = (p: { value: number }) => {
    capturedProgress = p
  }

  beforeEach(() => {
    capturedProgress = { value: 0 }
  })

  test('snaps progress to 0 when AppState becomes active while collapsed', async () => {
    await renderWithProviders(<CollapsedHarness onProgress={trackProgress} />)

    // Simulate a stale mid-animation value
    capturedProgress.value = 0.5

    // Clear call history from render so we only measure the snap path
    mockedWithTiming.mockClear()

    await act(async () => {
      emitState('active')
    })

    expect(capturedProgress.value).toBe(0)
    expect(mockedWithTiming).not.toHaveBeenCalled()
  })

  test('snaps progress to 1 when AppState becomes active while expanded', async () => {
    await renderWithProviders(<ExpandedHarness onProgress={trackProgress} />)

    // Simulate a stale mid-animation value
    capturedProgress.value = 0.5

    // Clear call history from render so we only measure the snap path
    mockedWithTiming.mockClear()

    await act(async () => {
      emitState('active')
    })

    expect(capturedProgress.value).toBe(1)
    expect(mockedWithTiming).not.toHaveBeenCalled()
  })

  test('does not snap on non-active state transitions', async () => {
    await renderWithProviders(<CollapsedHarness onProgress={trackProgress} />)

    capturedProgress.value = 0.5

    await act(async () => {
      emitState('background')
    })

    expect(capturedProgress.value).toBe(0.5)
  })
})

describe('useExpandAnimation restingContainerStyle', () => {
  test('returns collapsed geometry when expanded is false', async () => {
    let capturedResult: null | ReturnType<typeof useExpandAnimation> = null

    const Harness = ({
      onResult,
    }: {
      onResult: (r: ReturnType<typeof useExpandAnimation>) => void
    }) => {
      const result = useExpandAnimation(false, 56)
      onResult(result)
      return <Text testID='harness'>{String(result.progress.value)}</Text>
    }

    await renderWithProviders(
      <Harness
        onResult={r => {
          capturedResult = r
        }}
      />,
    )

    expect(capturedResult).not.toBeNull()
    expect(capturedResult).toMatchObject({
      restingContainerStyle: {
        borderBottomLeftRadius: RADIUSES.middle,
        borderBottomRightRadius: RADIUSES.middle,
        borderTopLeftRadius: RADIUSES.middle,
        borderTopRightRadius: RADIUSES.middle,
        bottom: 52,
        left: INDENTS.low,
        top: 800 - 52 - PLAYER_SIZES.miniPlayerHeight,
        width: 400 - INDENTS.low * 2,
      },
    })
  })
})
