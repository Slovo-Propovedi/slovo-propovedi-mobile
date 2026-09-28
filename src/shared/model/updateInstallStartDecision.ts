import { type Ctx } from '@reatom/framework'
import { Linking, Platform } from 'react-native'
import { isOnlineAtom } from './network'
import { releaseUrlAtom, zipDownloadUrlAtom } from './update'
import {
  isBusyUpdateState,
  updateDialogVisibleAtom,
  updateErrorAtom,
  updateErrorKindAtom,
  updateStateAtom,
} from './updateInstall'

const OFFLINE_ERROR_MESSAGE = 'Нет подключения к интернету'

const openReleaseInBrowser = async (releaseUrl: null | string): Promise<void> => {
  if (!releaseUrl) return
  await Linking.openURL(releaseUrl).catch(error =>
    console.error('[updateInstall] Failed to open release URL:', error),
  )
}

export const getStartDecision = async (ctx: Ctx): Promise<null | string> => {
  if (isBusyUpdateState(ctx.get(updateStateAtom))) {
    updateDialogVisibleAtom(ctx, true)
    return null
  }
  if (Platform.OS !== 'android') {
    await openReleaseInBrowser(ctx.get(releaseUrlAtom))
    return null
  }
  if (!ctx.get(isOnlineAtom)) {
    updateErrorKindAtom(ctx, 'offline')
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
