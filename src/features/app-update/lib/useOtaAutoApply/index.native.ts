import { useAtom } from '@reatom/npm-react'
import { Asset } from 'expo-asset'
import { reloadAsync, UpdateInfoType, useUpdates } from 'expo-updates'
import { useEffect, useRef } from 'react'
import { isPlayingAtom } from 'entities/player'
import {
  decideOtaAutoApply,
  isBusyUpdateState,
  updateDialogVisibleAtom,
  updateStateAtom,
} from 'shared/model'
import { useTheme } from 'shared/ui/theme'
import reloadScreenIcon from '../../../../../assets/reload-screen-icon.png'

// Grace period so a brief pause (a track change, a phone call) does not reload the app.
const OTA_AUTO_APPLY_DELAY_MS = 5000

const reloadScreenAsset = Asset.fromModule(reloadScreenIcon)

// The native reload screen decodes a `file://` source with BitmapFactory.decodeFile,
// which cannot read an APK-internal resource — the icon has to be a real local file.
const resolveReloadScreenImage = async (): Promise<string | undefined> => {
  try {
    await reloadScreenAsset.downloadAsync()
    return reloadScreenAsset.localUri ?? reloadScreenAsset.uri
  } catch (error) {
    console.warn('[update] ota reload screen icon unavailable:', error)
    return undefined
  }
}

const applyReload = async (backgroundColor: string): Promise<void> => {
  const image = await resolveReloadScreenImage()

  await reloadAsync({
    reloadScreenOptions: {
      backgroundColor,
      fade: true,
      image,
      imageResizeMode: 'contain',
      spinner: { enabled: false },
    },
  }).catch((error: unknown) => {
    console.warn('[update] ota auto-apply reload failed:', error)
  })
}

// The Android media service keeps the process alive after the app is swiped away,
// so a downloaded bundle would otherwise wait for a cold start that never comes.
export const useOtaAutoApply = (): void => {
  const { downloadedUpdate, isDownloading, isRestarting, isUpdatePending } = useUpdates()
  const [isPlaying] = useAtom(isPlayingAtom)
  const [updateState] = useAtom(updateStateAtom)
  const [updateDialogVisible] = useAtom(updateDialogVisibleAtom)
  const { currentTheme } = useTheme()
  const appliedUpdateIdRef = useRef<null | string>(null)
  const reloadBackgroundColor = String(currentTheme.background)

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
      void applyReload(reloadBackgroundColor)
    }, OTA_AUTO_APPLY_DELAY_MS)

    return () => clearTimeout(timer)
  }, [
    downloadedUpdate,
    isDownloading,
    isPlaying,
    isRestarting,
    isUpdatePending,
    reloadBackgroundColor,
    updateDialogVisible,
    updateState,
  ])
}
