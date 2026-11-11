import { action, atom } from '@reatom/framework'

const TOAST_DURATION_MS = 2000

let toastResetTimeoutId: null | ReturnType<typeof setTimeout> = null

export const toastAtom = atom<null | string>(null, 'toastAtom')

export const showToast = action((ctx, message: string) => {
  if (toastResetTimeoutId !== null) clearTimeout(toastResetTimeoutId)

  toastAtom(ctx, message)
  toastResetTimeoutId = setTimeout(() => {
    toastResetTimeoutId = null
    toastAtom(ctx, null)
  }, TOAST_DURATION_MS)
}, 'showToast')

// Test-support: a pending toast timer outlives the test that showed it and
// keeps the jest worker alive, so the global afterEach hook clears it.
export const clearToastTimerForTests = () => {
  if (toastResetTimeoutId !== null) {
    clearTimeout(toastResetTimeoutId)
    toastResetTimeoutId = null
  }
}
