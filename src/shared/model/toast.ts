import { action, atom } from '@reatom/framework'

const TOAST_DURATION_MS = 2000

export const toastAtom = atom<null | string>(null, 'toastAtom')

export const showToast = action((ctx, message: string) => {
  toastAtom(ctx, message)
  setTimeout(() => toastAtom(ctx, null), TOAST_DURATION_MS)
}, 'showToast')
