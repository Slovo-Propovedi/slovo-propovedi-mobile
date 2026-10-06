import { useAction } from '@reatom/npm-react'
import { useCallback, useState } from 'react'
import { type APITypes, filesApi } from 'shared/api'
import { getErrorMessage, getHttpStatus } from 'shared/lib/error-utils'
import { showToast } from 'shared/model'
import { reportError } from 'shared/model/error-dialog'
import { isDeletableOrphan } from './fileKind'

export interface CleanupResult {
  deleted: number
  failed: APITypes.CleanupOrphansResponseFailedItem[]
}

export interface OrphanedFilesState {
  cleanup: () => Promise<void>
  cleanupResult: CleanupResult | null
  hasScanned: boolean
  isCleaning: boolean
  isError: boolean
  isRemoving: boolean
  isScanning: boolean
  orphanCount: number
  orphaned: APITypes.FileMetadataDto[]
  remove: (file: APITypes.FileMetadataDto) => Promise<void>
  scan: () => Promise<void>
}

const SCAN_ERROR_MESSAGE = 'Не удалось получить список осиротевших файлов'
const CLEANUP_ERROR_MESSAGE = 'Не удалось выполнить очистку'
const DELETE_SUCCESS_MESSAGE = 'Файл удалён'
// Сервер отвечает 409, если аудио/текст ещё используется в проповеди.
const DELETE_IN_USE_MESSAGE = 'Файл используется в проповедях'
const HTTP_CONFLICT = 409

/**
 * Осиротевшие файлы (`GET /files/orphans`): скан, best-effort очистка
 * (`POST /files/orphans/cleanup`) и поштучное удаление аудио/текста
 * (`DELETE /files/{fileName}`). Скан опционален: он обходит весь bucket, поэтому
 * запускается только по запросу пользователя. Очистка/удаление касаются лишь
 * аудио/текста, изображения — вручную из каталога, поэтому счётчик считает
 * только удаляемые.
 */
export const useOrphanedFiles = (): OrphanedFilesState => {
  const showToastAction = useAction(showToast)
  const [orphaned, setOrphaned] = useState<APITypes.FileMetadataDto[]>([])
  const [isScanning, setIsScanning] = useState(false)
  const [isCleaning, setIsCleaning] = useState(false)
  const [isRemoving, setIsRemoving] = useState(false)
  const [isError, setIsError] = useState(false)
  const [hasScanned, setHasScanned] = useState(false)
  const [cleanupResult, setCleanupResult] = useState<CleanupResult | null>(null)

  const scan = useCallback(async () => {
    setIsScanning(true)
    setIsError(false)
    setCleanupResult(null)
    try {
      const response = await filesApi.getFiles().appControllerGetOrphanedFiles()
      setOrphaned(response.orphaned)
      setHasScanned(true)
    } catch (error) {
      setIsError(true)
      reportError(error, SCAN_ERROR_MESSAGE)
    } finally {
      setIsScanning(false)
    }
  }, [])

  const cleanup = useCallback(async () => {
    setIsCleaning(true)
    try {
      const response = await filesApi.getFiles().appControllerCleanupOrphanedFiles()
      setCleanupResult({ deleted: response.deleted.length, failed: response.failed })
      showToastAction(`Удалено файлов: ${response.deleted.length}`)
      // Пересканируем, чтобы список отразил фактическое состояние bucket.
      const refreshed = await filesApi.getFiles().appControllerGetOrphanedFiles()
      setOrphaned(refreshed.orphaned)
    } catch (error) {
      showToastAction(getErrorMessage(error) || CLEANUP_ERROR_MESSAGE)
    } finally {
      setIsCleaning(false)
    }
  }, [showToastAction])

  const remove = useCallback(
    async (file: APITypes.FileMetadataDto) => {
      if (isRemoving) return

      setIsRemoving(true)
      try {
        await filesApi.getFiles().appControllerRemoveFile(file.fileName)
        showToastAction(DELETE_SUCCESS_MESSAGE)
        // Локально убираем удалённый файл: полный рескан bucket из-за одной
        // строки не нужен.
        setOrphaned(current => current.filter(orphan => orphan.fileName !== file.fileName))
      } catch (error) {
        showToastAction(
          getHttpStatus(error) === HTTP_CONFLICT ? DELETE_IN_USE_MESSAGE : getErrorMessage(error),
        )
      } finally {
        setIsRemoving(false)
      }
    },
    [isRemoving, showToastAction],
  )

  return {
    cleanup,
    cleanupResult,
    hasScanned,
    isCleaning,
    isError,
    isRemoving,
    isScanning,
    orphanCount: orphaned.filter(isDeletableOrphan).length,
    orphaned,
    remove,
    scan,
  }
}
