import { action, atom } from '@reatom/framework'

export const openMenuIdAtom = atom<null | string>(null, 'openMenuIdAtom')

export const setOpenMenuId = action((ctx, id: null | string) => {
  openMenuIdAtom(ctx, id)
}, 'setOpenMenuId')
