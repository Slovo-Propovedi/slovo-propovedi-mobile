import { createCtx } from '@reatom/framework'
import { showToast, toastAtom } from './toast'

const TOAST_MESSAGE = 'Ссылка скопирована'
const SECOND_TOAST_MESSAGE = 'Текст скопирован'
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

  test('keeps a back-to-back toast visible for its own full duration', () => {
    showToast(ctx, TOAST_MESSAGE)
    jest.advanceTimersByTime(TOAST_DURATION_MS / 2)
    showToast(ctx, SECOND_TOAST_MESSAGE)

    // Таймер первого тоста не должен досрочно гасить второй.
    jest.advanceTimersByTime(TOAST_DURATION_MS / 2)
    expect(ctx.get(toastAtom)).toBe(SECOND_TOAST_MESSAGE)

    jest.advanceTimersByTime(TOAST_DURATION_MS / 2)
    expect(ctx.get(toastAtom)).toBeNull()
  })
})
