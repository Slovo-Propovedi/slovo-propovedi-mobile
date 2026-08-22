import { action, atom } from '@reatom/framework'
import { Linking, Platform } from 'react-native'
import {
  cleanupUpdateFiles,
  downloadUpdateZip,
  extractApkFromZip,
  installApk,
} from 'shared/lib/update-service'
import { isOnlineAtom } from './network'
import { releaseUrlAtom, zipDownloadUrlAtom } from './update'

export type UpdateState = 'downloading' | 'error' | 'extracting' | 'idle' | 'installing'

const OFFLINE_ERROR_MESSAGE = 'Нет подключения к интернету'
const UNKNOWN_ERROR_MESSAGE = 'Не удалось установить обновление'

export const updateStateAtom = atom<UpdateState>('idle', 'updateInstall.updateStateAtom')
export const updateProgressAtom = atom(0, 'updateInstall.updateProgressAtom')
export const updateErrorAtom = atom<null | string>(null, 'updateInstall.updateErrorAtom')
export const updateDialogVisibleAtom = atom(false, 'updateInstall.updateDialogVisibleAtom')

export const isBusyUpdateState = (updateState: UpdateState): boolean =>
  updateState === 'downloading' || updateState === 'extracting' || updateState === 'installing'

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error && error.message) return error.message
  return UNKNOWN_ERROR_MESSAGE
}

const openReleaseInBrowser = async (releaseUrl: null | string): Promise<void> => {
  if (!releaseUrl) return
  await Linking.openURL(releaseUrl).catch(error => {
    console.error('[updateInstall] Failed to open release URL:', error)
  })
}

export const startUpdateAction = action(async ctx => {
  const currentState = ctx.get(updateStateAtom)
  if (isBusyUpdateState(currentState)) {
    updateDialogVisibleAtom(ctx, true)
    return
  }

  if (Platform.OS !== 'android') {
    await openReleaseInBrowser(ctx.get(releaseUrlAtom))
    return
  }

  if (!ctx.get(isOnlineAtom)) {
    updateErrorAtom(ctx, OFFLINE_ERROR_MESSAGE)
    updateStateAtom(ctx, 'error')
    updateDialogVisibleAtom(ctx, true)
    return
  }

  const zipDownloadUrl = ctx.get(zipDownloadUrlAtom)
  if (!zipDownloadUrl) {
    await openReleaseInBrowser(ctx.get(releaseUrlAtom))
    return
  }

  updateDialogVisibleAtom(ctx, true)
  updateProgressAtom(ctx, 0)
  updateErrorAtom(ctx, null)
  updateStateAtom(ctx, 'downloading')

  try {
    const zipPath = await downloadUpdateZip(zipDownloadUrl, percent => {
      ctx.schedule(() => updateProgressAtom(ctx, percent))
    })

    await ctx.schedule(() => updateStateAtom(ctx, 'extracting'))
    const apkPath = await extractApkFromZip(zipPath)

    await ctx.schedule(() => updateStateAtom(ctx, 'installing'))
    await installApk(apkPath)
  } catch (installError) {
    console.error('[updateInstall] Update failed:', installError)
    await ctx.schedule(() => {
      updateErrorAtom(ctx, getErrorMessage(installError))
      updateStateAtom(ctx, 'error')
    })
  } finally {
    await cleanupUpdateFiles()
  }
}, 'startUpdateAction')

export const resetUpdateAction = action(ctx => {
  updateDialogVisibleAtom(ctx, false)
  updateStateAtom(ctx, 'idle')
  updateProgressAtom(ctx, 0)
  updateErrorAtom(ctx, null)
}, 'resetUpdateAction')
