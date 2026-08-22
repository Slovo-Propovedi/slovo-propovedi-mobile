import { atom } from '@reatom/framework'
import { useAtom } from '@reatom/npm-react'
import { Linking, Platform } from 'react-native'
import {
  cleanupUpdateFiles,
  downloadUpdateZip,
  extractApkFromZip,
  installApk,
} from 'shared/lib/update-service'
import { isOnlineAtom, releaseUrlAtom, zipDownloadUrlAtom } from 'shared/model'

export type UpdateState = 'downloading' | 'error' | 'extracting' | 'idle' | 'installing'

const OFFLINE_ERROR_MESSAGE = 'Нет подключения к интернету'
const UNKNOWN_ERROR_MESSAGE = 'Не удалось установить обновление'

const updateStateAtom = atom<UpdateState>('idle', 'appUpdate.updateStateAtom')
const progressAtom = atom(0, 'appUpdate.progressAtom')
const errorAtom = atom<null | string>(null, 'appUpdate.errorAtom')

interface UseUpdateInstallResult {
  error: null | string
  progress: number
  reset: () => void
  startUpdate: () => Promise<void>
  updateState: UpdateState
}

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error && error.message) return error.message
  return UNKNOWN_ERROR_MESSAGE
}

export const useUpdateInstall = (): UseUpdateInstallResult => {
  const [updateState, setUpdateState] = useAtom(updateStateAtom)
  const [progress, setProgress] = useAtom(progressAtom)
  const [error, setError] = useAtom(errorAtom)

  const [isOnline] = useAtom(isOnlineAtom)
  const [zipDownloadUrl] = useAtom(zipDownloadUrlAtom)
  const [releaseUrl] = useAtom(releaseUrlAtom)

  const openReleaseInBrowser = async (): Promise<void> => {
    if (!releaseUrl) return
    await Linking.openURL(releaseUrl).catch(openError => {
      console.error('[useUpdateInstall] Failed to open release URL:', openError)
    })
  }

  const startUpdate = async (): Promise<void> => {
    if (Platform.OS !== 'android') return openReleaseInBrowser()
    if (!isOnline) {
      setError(OFFLINE_ERROR_MESSAGE)
      setUpdateState('error')
      return
    }
    if (!zipDownloadUrl) return openReleaseInBrowser()

    setProgress(0)
    setError(null)
    try {
      setUpdateState('downloading')
      const zipPath = await downloadUpdateZip(zipDownloadUrl, percent => setProgress(percent))

      setUpdateState('extracting')
      const apkPath = await extractApkFromZip(zipPath)

      setUpdateState('installing')
      await installApk(apkPath)
    } catch (installError) {
      console.error('[useUpdateInstall] Update failed:', installError)
      setError(getErrorMessage(installError))
      setUpdateState('error')
    } finally {
      await cleanupUpdateFiles()
    }
  }

  const reset = (): void => {
    setUpdateState('idle')
    setProgress(0)
    setError(null)
  }

  return { error, progress, reset, startUpdate, updateState }
}
