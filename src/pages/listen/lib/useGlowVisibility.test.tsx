import { createCtx } from '@reatom/framework'
import { act } from '@testing-library/react-native'
import { type RefObject } from 'react'
import { Dimensions, type View } from 'react-native'
import { renderHookWithProviders } from 'shared/mocks/renderWithProviders'
import { isGlowVisibleAtom, isListenScrollingAtom } from '../model'
import { useGlowVisibility } from './useGlowVisibility'

const WINDOW_HEIGHT = 800
const VIEW_SIZE = 200
const OFFSCREEN_Y = WINDOW_HEIGHT + 50

type MeasureCallback = (x: number, y: number, width: number, height: number) => void

interface Measurement {
  height: number
  width: number
  y: number
}

const attachMeasurableNode = (ref: RefObject<null | View>, measurement: Measurement): jest.Mock => {
  const measureInWindow = jest.fn((callback: MeasureCallback) => {
    callback(0, measurement.y, measurement.width, measurement.height)
  })

  ref.current = { measureInWindow } as unknown as View

  return measureInWindow
}

const renderGlow = async (isFocused = true, ctx = createCtx()) => {
  const result = await renderHookWithProviders(() => useGlowVisibility({ isFocused }), { ctx })

  return { ...result, ctx }
}

const renderGlowOnScreen = { height: VIEW_SIZE, width: VIEW_SIZE, y: 100 }
const renderGlowOffScreen = { height: VIEW_SIZE, width: VIEW_SIZE, y: OFFSCREEN_Y }

describe('useGlowVisibility', () => {
  let dimensionsGetSpy: jest.SpyInstance

  beforeEach(() => {
    dimensionsGetSpy = jest.spyOn(Dimensions, 'get').mockReturnValue({
      fontScale: 1,
      height: WINDOW_HEIGHT,
      scale: 1,
      width: 400,
    })
  })

  afterEach(() => {
    dimensionsGetSpy.mockRestore()
  })

  test('marks the glow visible when the wrapper is fully on screen', async () => {
    const ctx = createCtx()
    isGlowVisibleAtom(ctx, false)
    const { result } = await renderGlow(true, ctx)

    attachMeasurableNode(result.current.ref, renderGlowOnScreen)
    await act(async () => {
      result.current.onLayout()
    })

    expect(ctx.get(isGlowVisibleAtom)).toBe(true)
  })

  test('marks the glow hidden when the wrapper is below the window', async () => {
    const { ctx, result } = await renderGlow()

    attachMeasurableNode(result.current.ref, renderGlowOffScreen)
    await act(async () => {
      result.current.onLayout()
    })

    expect(ctx.get(isGlowVisibleAtom)).toBe(false)
  })

  test('keeps the glow visible when the wrapper is only partially on screen', async () => {
    const ctx = createCtx()
    isGlowVisibleAtom(ctx, false)
    const { result } = await renderGlow(true, ctx)

    // Верх свечения ушёл за верхнюю границу, но низ ещё в окне.
    attachMeasurableNode(result.current.ref, { height: VIEW_SIZE, width: VIEW_SIZE, y: -100 })
    await act(async () => {
      result.current.onLayout()
    })

    expect(ctx.get(isGlowVisibleAtom)).toBe(true)
  })

  test('keeps the previous value on an invalid measure (zero size)', async () => {
    const { ctx, result } = await renderGlow()

    attachMeasurableNode(result.current.ref, { height: 0, width: 0, y: 0 })
    await act(async () => {
      result.current.onLayout()
    })

    expect(ctx.get(isGlowVisibleAtom)).toBe(true)
  })

  test('skips measuring while scrolling and re-measures once the scroll goes idle', async () => {
    const { ctx, result } = await renderGlow()
    const measureInWindow = attachMeasurableNode(result.current.ref, renderGlowOffScreen)

    await act(async () => {
      isListenScrollingAtom(ctx, true)
    })
    expect(measureInWindow).not.toHaveBeenCalled()

    await act(async () => {
      isListenScrollingAtom(ctx, false)
    })
    expect(measureInWindow).toHaveBeenCalledTimes(1)
    expect(ctx.get(isGlowVisibleAtom)).toBe(false)
  })

  test('does not measure while unfocused and measures when focus returns', async () => {
    const { rerender, result } = await renderHookWithProviders(
      (props: { isFocused: boolean }) => useGlowVisibility(props),
      { initialProps: { isFocused: false } },
    )
    const measureInWindow = attachMeasurableNode(result.current.ref, renderGlowOnScreen)

    await act(async () => {
      result.current.onLayout()
    })
    expect(measureInWindow).not.toHaveBeenCalled()

    await act(async () => {
      rerender({ isFocused: true })
    })
    expect(measureInWindow).toHaveBeenCalledTimes(1)
  })
})
