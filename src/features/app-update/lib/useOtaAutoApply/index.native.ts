import { useAtom } from '@reatom/npm-react'
import { reloadAsync, UpdateInfoType, useUpdates } from 'expo-updates'
import { useEffect, useRef } from 'react'
import { isPlayingAtom } from 'entities/player'
import {
  decideOtaAutoApply,
  isBusyUpdateState,
  updateDialogVisibleAtom,
  updateStateAtom,
} from 'shared/model'

// Grace period so a brief pause (a track change, a phone call) does not reload the app.
const OTA_AUTO_APPLY_DELAY_MS = 5000

// The Android media service keeps the process alive after the app is swiped away,
// so a downloaded bundle would otherwise wait for a cold start that never comes.
export const useOtaAutoApply = (): void => {
  const { downloadedUpdate, isDownloading, isRestarting, isUpdatePending } = useUpdates()
  const [isPlaying] = useAtom(isPlayingAtom)
  const [updateState] = useAtom(updateStateAtom)
  const [updateDialogVisible] = useAtom(updateDialogVisibleAtom)
  const appliedUpdateIdRef = useRef<null | string>(null)

  useEffect(() => {
    const pendingUpdateId =
      downloadedUpdate?.type === UpdateInfoType.NEW ? downloadedUpdate.updateId : null

    const shouldApply = decideOtaAutoApply({
      appliedUpdateId: appliedUpdateIdRef.current,
      isPendingUpdate: isUpdatePending && !isDownloading,
      isPlayerBusy: isPlaying,
      isReloading: isRestarting,
      isUpdateFlowBusy: updateDialogVisible || isBusyUpdateState(updateState),
      pendingUpdateId,
    })
    if (!shouldApply) return

    const timer = setTimeout(() => {
      // Mark at fire time: a cancelled timer may still be re-armed later.
      appliedUpdateIdRef.current = pendingUpdateId
      void reloadAsync().catch((error: unknown) => {
        console.warn('[update] ota auto-apply reload failed:', error)
      })
    }, OTA_AUTO_APPLY_DELAY_MS)

    return () => clearTimeout(timer)
  }, [
    downloadedUpdate,
    isDownloading,
    isPlaying,
    isRestarting,
    isUpdatePending,
    updateDialogVisible,
    updateState,
  ])
}
