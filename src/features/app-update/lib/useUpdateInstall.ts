import { useAction, useAtom } from '@reatom/npm-react'
import {
  resetUpdateAction,
  startUpdateAction,
  updateErrorAtom,
  updateProgressAtom,
  type UpdateState,
  updateStateAtom,
} from 'shared/model'

interface UseUpdateInstallResult {
  error: null | string
  progress: number
  reset: () => void
  startUpdate: () => Promise<void>
  updateState: UpdateState
}

export const useUpdateInstall = (): UseUpdateInstallResult => {
  const [updateState] = useAtom(updateStateAtom)
  const [progress] = useAtom(updateProgressAtom)
  const [error] = useAtom(updateErrorAtom)

  const reset = useAction(resetUpdateAction)
  const startUpdate = useAction(startUpdateAction)

  return { error, progress, reset, startUpdate, updateState }
}
