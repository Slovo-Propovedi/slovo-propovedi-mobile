import AsyncStorage from '@react-native-async-storage/async-storage'
import { action, atom } from '@reatom/framework'
import { APP_VERSION } from 'shared/config'
import { requestPermissions, scheduleNotification } from 'shared/lib/notifications'
import {
  compareVersions,
  fetchLatestRelease,
  type LatestReleaseInfo,
} from 'shared/lib/version-check'
import { isOnlineAtom } from './network'
import { updateDialogVisibleAtom } from './updateInstall'

const LAST_UPDATE_NOTIFIED_KEY = 'last-update-notified-version'
const UPDATE_NOTIFICATION_ID = 'app-update-notification'
const UPDATE_NOTIFICATION_TITLE = 'Доступна новая версия'
const UPDATE_NOTIFICATION_CATEGORY = 'app-update'
const UPDATE_NOTIFICATION_GROUP = 'app-update'

export const latestVersionAtom = atom<null | string>(null, 'latestVersionAtom')
export const releaseUrlAtom = atom<null | string>(null, 'releaseUrlAtom')
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
  if (!ctx.get(isOnlineAtom)) return

  const release = await fetchLatestRelease()
  if (!release) return

  const isUpdateAvailable = compareVersions(release.version, APP_VERSION) === 1
  if (!isUpdateAvailable) return

  await ctx.schedule(() => {
    latestVersionAtom(ctx, release.version)
    releaseUrlAtom(ctx, release.htmlUrl)
    zipDownloadUrlAtom(ctx, release.zipDownloadUrl)
  })

  await scheduleUpdateNotification(release)

  await ctx.schedule(() => {
    updateDialogVisibleAtom(ctx, true)
  })
}, 'checkForUpdateAction')
