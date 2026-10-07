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
