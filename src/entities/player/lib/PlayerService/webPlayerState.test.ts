import { setIsBufferingAction, setIsPlayingAction, setPositionAction } from '../../model'
import { createPubSub } from './webPlayerPubSub'
import { createWebPlayerState } from './webPlayerState'

jest.mock('shared/lib/reatom-ctx', () => ({ ctx: {} }))

jest.mock('../../model', () => ({
  setIsBufferingAction: jest.fn(),
  setIsPlayingAction: jest.fn(),
  setPositionAction: jest.fn(),
}))

const mockedSetIsPlaying = jest.mocked(setIsPlayingAction)
const mockedSetIsBuffering = jest.mocked(setIsBufferingAction)
const mockedSetPosition = jest.mocked(setPositionAction)

beforeEach(() => jest.clearAllMocks())

describe('createWebPlayerState → Reatom bridge', () => {
  test('mirrors isPlaying / isBuffering / position changes to the shared atoms', () => {
    const state = createWebPlayerState(createPubSub())

    state.setIsPlaying(true)
    state.setIsBuffering(true)
    state.setPosition(4200)

    expect(mockedSetIsPlaying).toHaveBeenLastCalledWith(expect.anything(), true)
    expect(mockedSetIsBuffering).toHaveBeenLastCalledWith(expect.anything(), true)
    expect(mockedSetPosition).toHaveBeenLastCalledWith(expect.anything(), 4200)
  })

  test('does not re-dispatch when a value is unchanged', () => {
    const state = createWebPlayerState(createPubSub())

    state.setIsPlaying(true)
    state.setIsPlaying(true)

    expect(mockedSetIsPlaying).toHaveBeenCalledTimes(1)
  })

  test('notifies subscribers on every update', () => {
    const pubsub = createPubSub()
    const listener = jest.fn()
    pubsub.subscribe(listener)
    const state = createWebPlayerState(pubsub)

    state.setPosition(1)
    state.setPosition(2)

    expect(listener).toHaveBeenCalledTimes(2)
  })
})
