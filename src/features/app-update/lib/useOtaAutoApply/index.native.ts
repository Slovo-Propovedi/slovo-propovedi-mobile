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
import darkSplashIcon from '../../../../../assets/dark-splash-icon.png'
import lightSplashIcon from '../../../../../assets/light-splash-icon.png'

// Grace period so a brief pause (a track change, a phone call) does not reload the app.
const OTA_AUTO_APPLY_DELAY_MS = 5000

// Native splash parity: expo-splash-screen draws the icon at 152dp (app.config.ts
// `splashImageProps.imageWidth`). expo-updates only auto-fills dimensions for a numeric
// `require()` source; a plain URI string leaves them undefined and the native view falls
// back to MATCH_PARENT, painting the icon screen-wide. State the size explicitly.
const OTA_RELOAD_ICON_SIZE_DP = 152

const lightSplashIconAsset = Asset.fromModule(lightSplashIcon)
const darkSplashIconAsset = Asset.fromModule(darkSplashIcon)

// The native reload screen reads only a real local file (BitmapFactory.decodeFile):
// a bundler/http URI or an APK resource cannot be painted. Anything but `localUri`
// is dropped so the screen degrades to the themed background and spinner.
const resolveReloadScreenImage = async (asset: Asset): Promise<string | undefined> => {
  try {
    await asset.downloadAsync()
    return asset.localUri ?? undefined
  } catch (error) {
    console.warn('[update] ota reload screen image unavailable:', error)
    return undefined
  }
}

// A URI string carries no dimensions, so wrap it into the object source expo-updates
// forwards as-is to the native reload screen (there width/height are applied in dp).
const sizeReloadScreenImage = (uri: string | undefined) =>
  uri ? { height: OTA_RELOAD_ICON_SIZE_DP, url: uri, width: OTA_RELOAD_ICON_SIZE_DP } : undefined

const applyReload = async (backgroundColor: string, isLight: boolean): Promise<void> => {
  // Pre-cache both contour-mark images once, so a later theme flip applies
  // without a re-download; each apply uses exactly one.
  const [lightSplashIconUri, darkSplashIconUri] = await Promise.all([
    resolveReloadScreenImage(lightSplashIconAsset),
    resolveReloadScreenImage(darkSplashIconAsset),
  ])
  const image = sizeReloadScreenImage(isLight ? lightSplashIconUri : darkSplashIconUri)

  console.warn('[update] ota reload screen config:', {
    chosenUri: image?.url ?? 'none',
    darkUri: darkSplashIconUri ?? 'none',
    isLight,
    lightUri: lightSplashIconUri ?? 'none',
  })

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
  const { currentTheme, isLight } = useTheme()
  const appliedUpdateIdRef = useRef<null | string>(null)
  // Mirror the web splash pair on the reload canvas: the scheme's contour mark
  // on the cold-start background (orange in light, black in dark).
  const reloadBackgroundColor = String(isLight ? currentTheme.primary : currentTheme.background)

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
      void applyReload(reloadBackgroundColor, isLight)
    }, OTA_AUTO_APPLY_DELAY_MS)

    return () => clearTimeout(timer)
  }, [
    downloadedUpdate,
    isDownloading,
    isLight,
    isPlaying,
    isRestarting,
    isUpdatePending,
    reloadBackgroundColor,
    updateDialogVisible,
    updateState,
  ])
}
