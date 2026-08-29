import { action, type Ctx } from '@reatom/framework'
import { Linking, Platform } from 'react-native'
import {
  apkFileExists,
  canRequestPackageInstalls,
  cleanupUpdateFiles,
  extractApkFromZip,
  getInstallErrorMessage,
  installApk,
} from 'shared/lib/update-service'
import { isOnlineAtom } from './network'
import { releaseUrlAtom, zipDownloadUrlAtom } from './update'
import {
  decidePermissionResume,
  isBusyUpdateState,
  updateDialogVisibleAtom,
  updateErrorAtom,
  updateProgressAtom,
  updateStateAtom,
} from './updateInstall'
import { downloadUpdateZipWithFallback } from './updateInstallFallback'

const OFFLINE_ERROR_MESSAGE = 'Нет подключения к интернету'

// Path of the extracted APK waiting for the install-permission grant.
let pendingApkPath: null | string = null

const setErrorState = async (ctx: Ctx, error: unknown): Promise<void> => {
  const message = getInstallErrorMessage(error)
  await ctx.schedule(() => {
    updateErrorAtom(ctx, message)
    updateStateAtom(ctx, 'error')
  })
}

const openReleaseInBrowser = async (releaseUrl: null | string): Promise<void> => {
  if (!releaseUrl) return
  await Linking.openURL(releaseUrl).catch(error =>
    console.error('[updateInstall] Failed to open release URL:', error),
  )
}

const performUpdate = async (ctx: Ctx, zipDownloadUrl: string): Promise<void> => {
  try {
    await cleanupUpdateFiles()
    const zipPath = await downloadUpdateZipWithFallback(ctx, zipDownloadUrl)

    await ctx.schedule(() => updateStateAtom(ctx, 'extracting'))
    const apkPath = await extractApkFromZip(zipPath)

    if (!(await canRequestPackageInstalls())) {
      pendingApkPath = apkPath
      await ctx.schedule(() => updateStateAtom(ctx, 'permission'))
      return
    }

    await ctx.schedule(() => updateStateAtom(ctx, 'installing'))
    await installApk(apkPath)
  } catch (installError) {
    console.error('[updateInstall] Update failed:', installError)
    await setErrorState(ctx, installError)
  }
}

const getStartDecision = async (ctx: Ctx): Promise<null | string> => {
  if (isBusyUpdateState(ctx.get(updateStateAtom))) {
    updateDialogVisibleAtom(ctx, true)
    return null
  }
  if (Platform.OS !== 'android') {
    await openReleaseInBrowser(ctx.get(releaseUrlAtom))
    return null
  }
  if (!ctx.get(isOnlineAtom)) {
    updateErrorAtom(ctx, OFFLINE_ERROR_MESSAGE)
    updateStateAtom(ctx, 'error')
    updateDialogVisibleAtom(ctx, true)
    return null
  }
  const zipDownloadUrl = ctx.get(zipDownloadUrlAtom)
  if (!zipDownloadUrl) {
    await openReleaseInBrowser(ctx.get(releaseUrlAtom))
    return null
  }
  return zipDownloadUrl
}

export const startUpdateAction = action(async ctx => {
  const zipDownloadUrl = await getStartDecision(ctx)
  if (!zipDownloadUrl) return

  updateDialogVisibleAtom(ctx, true)
  updateProgressAtom(ctx, 0)
  updateErrorAtom(ctx, null)
  updateStateAtom(ctx, 'downloading')

  await performUpdate(ctx, zipDownloadUrl)
}, 'startUpdateAction')

export const resumeUpdateAfterPermissionAction = action(async ctx => {
  if (ctx.get(updateStateAtom) !== 'permission') return

  const apkPath = pendingApkPath
  if (!apkPath) return

  const canInstall = await canRequestPackageInstalls()
  const decision = decidePermissionResume(canInstall, apkFileExists(apkPath))
  if (decision === 'wait') return

  pendingApkPath = null
  if (decision === 'restart') return startUpdateAction(ctx)

  try {
    await ctx.schedule(() => updateStateAtom(ctx, 'installing'))
    await installApk(apkPath)
  } catch (installError) {
    console.error('[updateInstall] Update failed:', installError)
    await setErrorState(ctx, installError)
  }
}, 'resumeUpdateAfterPermissionAction')

export const resetUpdateAction = action(ctx => {
  pendingApkPath = null
  updateDialogVisibleAtom(ctx, false)
  updateStateAtom(ctx, 'idle')
  updateProgressAtom(ctx, 0)
  updateErrorAtom(ctx, null)
}, 'resetUpdateAction')
