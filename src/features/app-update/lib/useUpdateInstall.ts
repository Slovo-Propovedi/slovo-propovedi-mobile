import { useAction, useAtom } from '@reatom/npm-react'
import { useEffect } from 'react'
import { AppState, type AppStateStatus } from 'react-native'
import { useDebounce } from 'shared/lib/hooks/useDebounce'
import { type UpdateErrorKind } from 'shared/lib/update-service'
import {
  resetUpdateAction,
  resumeUpdateAfterPermissionAction,
  startUpdateAction,
  updateErrorAtom,
  updateErrorKindAtom,
  updateProgressAtom,
  type UpdateState,
  updateStateAtom,
} from 'shared/model'

const PERMISSION_RESUME_DELAY_MS = 500

interface UseUpdateInstallResult {
  error: null | string
  errorKind: null | UpdateErrorKind
  progress: number
  reset: () => void
  startUpdate: () => Promise<void>
  updateState: UpdateState
}

export const useUpdateInstall = (): UseUpdateInstallResult => {
  const [updateState] = useAtom(updateStateAtom)
  const [progress] = useAtom(updateProgressAtom)
  const [error] = useAtom(updateErrorAtom)
  const [errorKind] = useAtom(updateErrorKindAtom)

  const reset = useAction(resetUpdateAction)
  const startUpdate = useAction(startUpdateAction)
  const resumeUpdate = useAction(resumeUpdateAfterPermissionAction)

  const resumeAfterActive = useDebounce(
    () => {
      void resumeUpdate()
    },
    PERMISSION_RESUME_DELAY_MS,
    [resumeUpdate],
  )

  useEffect(() => {
    const handleAppStateChange = (nextState: AppStateStatus) => {
      if (nextState === 'active') resumeAfterActive()
    }

    const subscription = AppState.addEventListener('change', handleAppStateChange)
    return () => subscription.remove()
  }, [resumeAfterActive])

  return { error, errorKind, progress, reset, startUpdate, updateState }
}
