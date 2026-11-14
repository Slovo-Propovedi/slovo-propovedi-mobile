import { createCtx } from '@reatom/framework'
import { useAtomMorphDriver } from 'shared/lib/hooks/useAtomMorphDriver'
import { renderHookWithProviders } from 'shared/mocks/renderWithProviders'
import { isBarCollapsedAtom, setBarCollapsed } from 'shared/ui/layout'
import { barMorphDriver, resetBarMorphDriver } from './barMorphDriver'
import { expandBarOnLaunch } from './expandBarOnLaunch'

describe('expandBarOnLaunch', () => {
  beforeEach(() => {
    resetBarMorphDriver()
  })

  test('expands a bar left collapsed by the previous process before any surface mounts', async () => {
    const ctx = createCtx()
    setBarCollapsed(ctx, true)
    barMorphDriver.seed(ctx)
    expect(barMorphDriver.progress.value).toBe(1)

    expandBarOnLaunch(ctx)

    // Snapped, not slid: the shared value already rests expanded before a mount.
    expect(barMorphDriver.progress.value).toBe(0)

    // A later mount seeds settled/progress from the atom during render, so the
    // fix must already be in place BEFORE React renders anything.
    const { result } = await renderHookWithProviders(() => useAtomMorphDriver(barMorphDriver), {
      ctx,
    })

    expect(result.current.progress.value).toBe(0)
    expect(result.current.settled).toBe(false)
  })

  test('is idempotent and keeps an already expanded bar untouched', () => {
    const ctx = createCtx()
    setBarCollapsed(ctx, true)
    let changeCount = 0
    ctx.subscribe(isBarCollapsedAtom, () => {
      changeCount += 1
    })

    expandBarOnLaunch(ctx)
    expandBarOnLaunch(ctx)

    expect(barMorphDriver.progress.value).toBe(0)
    // 1 initial subscription call + 1 real flip; the second call is a no-op.
    expect(changeCount).toBe(2)
  })
})
