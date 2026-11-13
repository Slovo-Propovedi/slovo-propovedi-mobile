import { renderHook } from '@testing-library/react-native'
import { makeMutable } from 'react-native-reanimated'
import { miniPillOpacitySv } from './miniPillFade'
import { useMiniPillFade } from './useMiniPillFade'

const focusProgress = makeMutable(0)

// Captures the shared value the hook seeds during its first render, before the
// fade effect can animate it away.
const renderedSeeds = async (isHidden: boolean, focusValue: number) => {
  focusProgress.value = focusValue
  // Stale module value from the previous mount: the seed must win over it.
  miniPillOpacitySv.value = 1
  const seeds: number[] = []

  await renderHook(() => {
    const pillOpacity = useMiniPillFade(isHidden, focusProgress)
    seeds.push(pillOpacity.value)

    return pillOpacity
  })

  return seeds
}

describe('useMiniPillFade', () => {
  test('seeds a plain first mount at full opacity', async () => {
    expect((await renderedSeeds(false, 0))[0]).toBe(1)
  })

  test('seeds a hidden mount at zero', async () => {
    expect((await renderedSeeds(true, 0))[0]).toBe(0)
  })

  test('seeds a remount during the un-tuck from the slide remainder', async () => {
    // The tuck is fully landed when the pill remounts, so it must start
    // invisible and fade in with the rise instead of popping in at full opacity.
    expect((await renderedSeeds(false, 1))[0]).toBe(0)
  })
})
