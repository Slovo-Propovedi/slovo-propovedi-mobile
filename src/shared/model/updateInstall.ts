import { atom } from '@reatom/framework'

export type PermissionResumeDecision = 'install' | 'restart' | 'wait'

export type UpdateState =
  'downloading' | 'error' | 'extracting' | 'idle' | 'installing' | 'permission'

export const updateStateAtom = atom<UpdateState>('idle', 'updateInstall.updateStateAtom')
export const updateProgressAtom = atom(0, 'updateInstall.updateProgressAtom')
export const updateErrorAtom = atom<null | string>(null, 'updateInstall.updateErrorAtom')
export const updateDialogVisibleAtom = atom(false, 'updateInstall.updateDialogVisibleAtom')

export const isBusyUpdateState = (updateState: UpdateState): boolean =>
  updateState === 'downloading' || updateState === 'extracting' || updateState === 'installing'

export const decidePermissionResume = (
  canInstall: boolean,
  apkExists: boolean,
): PermissionResumeDecision => {
  if (!canInstall) return 'wait'
  return apkExists ? 'install' : 'restart'
}
