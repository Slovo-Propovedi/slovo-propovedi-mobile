import { action, type Ctx } from '@reatom/framework'
import {
  apkFileExists,
  canRequestPackageInstalls,
  classifyUpdateError,
  cleanupUpdateFiles,
  extractApkFromZip,
  installApk,
  isUnexpectedUpdateError,
} from 'shared/lib/update-service'
import { reportError } from './error-dialog'
import {
  decidePermissionResume,
  updateDialogVisibleAtom,
  updateErrorAtom,
  updateErrorKindAtom,
  updateProgressAtom,
  updateStateAtom,
} from './updateInstall'
import { downloadUpdateZipWithFallback } from './updateInstallFallback'
import { getStartDecision } from './updateInstallStartDecision'

const UPDATE_ERROR_REPORT_MESSAGE = 'Ошибка обновления приложения'

// Path of the extracted APK waiting for the install-permission grant.
let pendingApkPath: null | string = null

const handleUpdateFailure = async (ctx: Ctx, error: unknown): Promise<void> => {
  console.error('[updateInstall] Update failed:', error)

  const { kind, message } = classifyUpdateError(error)

  // Foreseen kinds (download, extract, install-*, offline) already carry a
  // curated Russian message in the dialog, so the global error dialog would
  // only stack raw tech text on top. Unexpected kinds (`unknown`,
  // `install-generic`) have no known cause — surface the raw detail globally
  // so the user can screenshot/send it to the developer.
  if (isUnexpectedUpdateError(kind)) reportError(error, UPDATE_ERROR_REPORT_MESSAGE)

  await ctx.schedule(() => {
    updateErrorKindAtom(ctx, kind)
    updateErrorAtom(ctx, message)
    updateStateAtom(ctx, 'error')
  })
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
    await handleUpdateFailure(ctx, installError)
  }
}

export const startUpdateAction = action(async ctx => {
  const zipDownloadUrl = await getStartDecision(ctx)
  if (!zipDownloadUrl) return

  updateDialogVisibleAtom(ctx, true)
  updateProgressAtom(ctx, 0)
  updateErrorKindAtom(ctx, null)
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
    await handleUpdateFailure(ctx, installError)
  }
}, 'resumeUpdateAfterPermissionAction')

export const resetUpdateAction = action(ctx => {
  pendingApkPath = null
  updateDialogVisibleAtom(ctx, false)
  updateStateAtom(ctx, 'idle')
  updateProgressAtom(ctx, 0)
  updateErrorKindAtom(ctx, null)
  updateErrorAtom(ctx, null)
}, 'resetUpdateAction')
