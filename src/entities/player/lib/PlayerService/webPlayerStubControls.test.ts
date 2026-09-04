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

  test('lock-screen and volume setters are no-ops that resolve/return without throwing', async () => {
    const controls = createWebStubControls(makeState)

    expect(controls.setLockScreenMetadata()).toBeUndefined()
    expect(controls.reassertLockScreenMetadata()).toBeUndefined()
    await expect(controls.setVolume()).resolves.toBeUndefined()
  })
})
