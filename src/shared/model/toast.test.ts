import { createCtx } from '@reatom/framework'
import { showToast, toastAtom } from './toast'

const TOAST_MESSAGE = 'Ссылка скопирована'
const TOAST_DURATION_MS = 2000

describe('toast model', () => {
  let ctx: ReturnType<typeof createCtx>

  beforeEach(() => {
    jest.useFakeTimers()
    ctx = createCtx()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  test('toastAtom starts empty', () => {
    expect(ctx.get(toastAtom)).toBeNull()
  })

  test('showToast sets the message', () => {
    showToast(ctx, TOAST_MESSAGE)

    expect(ctx.get(toastAtom)).toBe(TOAST_MESSAGE)
  })

  test('auto-clears the message after the toast duration', () => {
    showToast(ctx, TOAST_MESSAGE)
    expect(ctx.get(toastAtom)).toBe(TOAST_MESSAGE)

    jest.advanceTimersByTime(TOAST_DURATION_MS)

    expect(ctx.get(toastAtom)).toBeNull()
  })
})
