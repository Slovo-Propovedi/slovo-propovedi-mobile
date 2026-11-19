interface MorphFrameRegistration {
  callback: (frameInfo: {
    timeSinceFirstFrame: number
    timeSincePreviousFrame: null | number
    timestamp: number
  }) => void
  isActive: boolean
}

const { __frameCallbacks } = jest.requireMock<{
  __frameCallbacks: MorphFrameRegistration[]
}>('react-native-reanimated')

const driveFrame = (index: number, deltaMs: number) => {
  __frameCallbacks
    .filter(registration => registration.isActive)
    .forEach(registration =>
      registration.callback({
        timeSinceFirstFrame: index * deltaMs,
        timeSincePreviousFrame: deltaMs,
        timestamp: index * deltaMs,
      }),
    )
}

/**
 * Steps every active UI-thread clock once per simulated frame. The real
 * `useFrameCallback` runs on the UI thread; tests own that thread, so a morph
 * stays mid-flight until frames are driven, exactly like a real render loop.
 * @param frameCount - Simulated frames; the default covers one morph duration.
 * @param deltaMs - Frame delta reported to the worklet.
 */
export const advanceMorphFrames = (frameCount = 4, deltaMs = 100) => {
  for (let index = 0; index < frameCount; index++) driveFrame(index, deltaMs)
}

/** Number of active clocks, for "nothing is animating" assertions. */
export const countActiveMorphFrames = () => __frameCallbacks.filter(cb => cb.isActive).length
