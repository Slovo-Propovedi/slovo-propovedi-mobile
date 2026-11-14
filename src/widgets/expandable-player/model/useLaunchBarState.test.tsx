import { createCtx } from '@reatom/framework'
import { act } from '@testing-library/react-native'
import { useAtomMorphDriver } from 'shared/lib/hooks/useAtomMorphDriver'
import { renderWithProviders } from 'shared/mocks/renderWithProviders'
import { setBarCollapsed } from 'shared/ui/layout'
import { barMorphDriver, resetBarMorphDriver } from './barMorphDriver'
import { useLaunchBarState } from './useLaunchBarState'

interface BarSurfaceState {
  progress: number
  settled: boolean
}

const ChildSurface = ({ onRender }: { onRender: (state: BarSurfaceState) => void }) => {
  const { progress, settled } = useAtomMorphDriver(barMorphDriver)
  onRender({ progress: progress.value, settled })

  return null
}

const LaunchRoot = ({ onRender }: { onRender: (state: BarSurfaceState) => void }) => {
  useLaunchBarState()

  return <ChildSurface onRender={onRender} />
}

const captureFirstRender = () => {
  let firstRender: BarSurfaceState | null = null

  return {
    get: () => firstRender,
    onRender: (state: BarSurfaceState) => {
      firstRender ??= state
    },
  }
}

describe('useLaunchBarState', () => {
  beforeEach(() => {
    resetBarMorphDriver()
  })

  test('expands a bar left collapsed by the previous process before the chrome seeds settled', async () => {
    const ctx = createCtx()
    setBarCollapsed(ctx, true)
    barMorphDriver.seed(ctx)
    expect(barMorphDriver.progress.value).toBe(1)

    const capture = captureFirstRender()
    await renderWithProviders(<LaunchRoot onRender={capture.onRender} />, { ctx })

    // The child seeds `settled` from the atom during the SAME render pass, so
    // the root's render-phase reset must already be in place: the first frame
    // paints expanded geometry instead of the collapsed shade band.
    expect(capture.get()).toEqual({ progress: 0, settled: false })
    expect(barMorphDriver.progress.value).toBe(0)
  })

  test('corrects the bar on every root mount in a process that survived a swipe from recents', async () => {
    const ctx = createCtx()
    const firstMount = await renderWithProviders(<LaunchRoot onRender={() => {}} />, { ctx })
    await firstMount.unmount()

    // The live JS process kept the collapsed flag from the previous activity.
    await act(async () => {
      setBarCollapsed(ctx, true)
    })
    barMorphDriver.seed(ctx)
    expect(barMorphDriver.progress.value).toBe(1)

    const capture = captureFirstRender()
    await renderWithProviders(<LaunchRoot onRender={capture.onRender} />, { ctx })

    expect(capture.get()).toEqual({ progress: 0, settled: false })
  })

  test('keeps an already expanded bar untouched', async () => {
    const ctx = createCtx()
    let changeCount = 0
    ctx.subscribe(barMorphDriver.atom, () => {
      changeCount += 1
    })

    const capture = captureFirstRender()
    await renderWithProviders(<LaunchRoot onRender={capture.onRender} />, { ctx })

    expect(capture.get()).toEqual({ progress: 0, settled: false })
    // Only the initial subscription call: the reset is a no-op on an expanded bar.
    expect(changeCount).toBe(1)
  })
})
