import { useAction, useAtom } from '@reatom/npm-react'
import debounce from 'debounce'
import { useEffect } from 'react'
import { AppState, type AppStateStatus } from 'react-native'
import {
  resetUpdateAction,
  resumeUpdateAfterPermissionAction,
  startUpdateAction,
  updateErrorAtom,
  updateProgressAtom,
  type UpdateState,
  updateStateAtom,
} from 'shared/model'

const PERMISSION_RESUME_DELAY_MS = 500

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
  const resumeUpdate = useAction(resumeUpdateAfterPermissionAction)

  useEffect(() => {
    const resumeAfterActive = debounce(() => {
      void resumeUpdate()
    }, PERMISSION_RESUME_DELAY_MS)

    const handleAppStateChange = (nextState: AppStateStatus) => {
      if (nextState === 'active') resumeAfterActive()
    }

    const subscription = AppState.addEventListener('change', handleAppStateChange)
    return () => {
      subscription.remove()
      resumeAfterActive.clear()
    }
  }, [resumeUpdate])

  return { error, progress, reset, startUpdate, updateState }
}
