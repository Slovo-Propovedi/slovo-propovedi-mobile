import type { WebPlayerStateData } from './webPlayerState'
import { createWebStubControls } from './webPlayerStubControls'

const makeState = (overrides: Partial<WebPlayerStateData> = {}): WebPlayerStateData => ({
  duration: 0,
  isBuffering: false,
  isPlaying: false,
  position: 0,
  ...overrides,
})

describe('createWebStubControls', () => {
  test('getStatus projects duration/isPlaying/position from the web player state', () => {
    const controls = createWebStubControls(() =>
      makeState({ duration: 1000, isBuffering: true, isPlaying: true, position: 250 }),
    )

    expect(controls.getStatus()).toEqual({ duration: 1000, isPlaying: true, position: 250 })
  })

  test('getVolume reports full volume', () => {
    expect(createWebStubControls(makeState).getVolume()).toBe(1)
  })

  test('setVolume resolves without throwing', async () => {
    const controls = createWebStubControls(makeState)

    await expect(controls.setVolume()).resolves.toBeUndefined()
  })
})
