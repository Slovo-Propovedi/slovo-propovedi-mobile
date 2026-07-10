import { useAtom } from '@reatom/npm-react'
import type { AudioPlayerData } from './PlayerControls.types'
import { downloadingAudioUrlAtom, isDownloadingAtom } from '../../lib/download-model'

/**
 * Определяет загружается ли аудио, которое сейчас воспроизводится.
 * Сравнивает URL текущего аудио с URL загружаемого файла.
 * @param currentAudio - Текущее воспроизводимое аудио.
 */
export const usePlayerDownloadState = (currentAudio: AudioPlayerData | null): boolean => {
  const [isDownloading] = useAtom(isDownloadingAtom)

  const [downloadingAudioUrl] = useAtom(downloadingAudioUrlAtom)

  return isDownloading && downloadingAudioUrl === currentAudio?.audioUrl
}
