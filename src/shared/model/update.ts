import AsyncStorage from '@react-native-async-storage/async-storage'
import { action, atom } from '@reatom/framework'
import { Platform } from 'react-native'
import { requestPermissions, scheduleNotification } from '../lib/notifications/notificationsHelpers'
import { fetchLatestRelease } from '../lib/version-check/fetchLatestRelease'
import { type LatestReleaseInfo } from '../lib/version-check/types'
import { isOnlineAtom } from './network'
import { updateDialogVisibleAtom } from './updateInstall'
import { decideUpdatePrompt, isReleaseNewerThanRunning } from './updateOtaGate'
import { isOtaUpdateAvailable, readRunningAppVersion } from './updateOtaStatus'

const LAST_UPDATE_NOTIFIED_KEY = 'last-update-notified-version'
const UPDATE_NOTIFICATION_ID = 'app-update-notification'
const UPDATE_NOTIFICATION_TITLE = 'Доступна новая версия'
const UPDATE_NOTIFICATION_CATEGORY = 'app-update'
const UPDATE_NOTIFICATION_GROUP = 'app-update'

export const latestVersionAtom = atom<null | string>(null, 'latestVersionAtom')
export const releaseUrlAtom = atom<null | string>(null, 'releaseUrlAtom')
export const sha256SumsUrlAtom = atom<null | string>(null, 'sha256SumsUrlAtom')
export const zipDownloadUrlAtom = atom<null | string>(null, 'zipDownloadUrlAtom')

const readLastNotifiedVersion = async (): Promise<null | string> => {
  try {
    return await AsyncStorage.getItem(LAST_UPDATE_NOTIFIED_KEY)
  } catch (error) {
    console.warn('[update] AsyncStorage error:', error)
    return null
  }
}

const writeLastNotifiedVersion = async (version: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(LAST_UPDATE_NOTIFIED_KEY, version)
  } catch (error) {
    console.warn('[update] AsyncStorage error:', error)
  }
}

const scheduleUpdateNotification = async (release: LatestReleaseInfo): Promise<void> => {
  const lastNotifiedVersion = await readLastNotifiedVersion()
  if (lastNotifiedVersion === release.version) return

  const permissionsGranted = await requestPermissions()
  if (!permissionsGranted) return

  await scheduleNotification(
    {
      body: `Слово.Проповеди ${release.version}`,
      categoryIdentifier: UPDATE_NOTIFICATION_CATEGORY,
      data: { groupId: UPDATE_NOTIFICATION_GROUP, releaseUrl: release.htmlUrl },
      title: UPDATE_NOTIFICATION_TITLE,
    },
    UPDATE_NOTIFICATION_ID,
    UPDATE_NOTIFICATION_GROUP,
  )

  await writeLastNotifiedVersion(release.version)
}

export const checkForUpdateAction = action(async ctx => {
  // Web is a PWA and updates itself via the service worker — the native
  // APK-download dialog is meaningless there.
  if (Platform.OS === 'web') return
  if (!ctx.get(isOnlineAtom)) return

  const release = await fetchLatestRelease()
  if (!release) return

  // The running code may be an OTA bundle newer than the version baked into the
  // APK, so the release is compared against what actually runs right now.
  const runningVersion = await readRunningAppVersion()
  const releaseIsNewer = isReleaseNewerThanRunning(release.version, runningVersion)

  // A newer release that is also available over OTA needs no prompt: the bundle
  // applies on the next cold start, after which the running version matches the
  // release. Both the dialog and the push notification are skipped.
  const otaAvailable = releaseIsNewer ? await isOtaUpdateAvailable() : false
  if (!decideUpdatePrompt({ otaAvailable, releaseIsNewer })) return

  await ctx.schedule(() => {
    latestVersionAtom(ctx, release.version)
    releaseUrlAtom(ctx, release.htmlUrl)
    sha256SumsUrlAtom(ctx, release.sha256SumsDownloadUrl ?? null)
    zipDownloadUrlAtom(ctx, release.zipDownloadUrl)
  })

  await scheduleUpdateNotification(release)

  await ctx.schedule(() => {
    updateDialogVisibleAtom(ctx, true)
  })
}, 'checkForUpdateAction')
