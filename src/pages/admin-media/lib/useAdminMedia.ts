import { useAction } from '@reatom/npm-react'
import { useCallback, useEffect, useState } from 'react'
import { type APITypes, filesApi, type PickedUploadAsset, uploadSermonFile } from 'shared/api'
import { getErrorMessage, getHttpStatus } from 'shared/lib/error-utils'
import { showToast } from 'shared/model'
import { reportError } from 'shared/model/error-dialog'

export interface AdminMediaState {
  files: APITypes.FileMetadataDto[]
  isDeleting: boolean
  isError: boolean
  isLoading: boolean
  isUploading: boolean
  progress: number
  reload: () => void
  remove: (file: APITypes.FileMetadataDto) => Promise<void>
  upload: (asset: PickedUploadAsset, onUpload: (fileName: string) => void) => Promise<void>
}

const LOAD_ERROR_MESSAGE = 'Не удалось загрузить файлы'
const DELETE_SUCCESS_MESSAGE = 'Обложка удалена'
const UPLOAD_SUCCESS_MESSAGE = 'Обложка загружена'
const DELETE_IN_USE_MESSAGE = 'Обложка используется в проповедях/плейлистах'
const HTTP_CONFLICT = 409

/**
 * Каталог медиа-библиотеки (`GET /files`): загрузка изображения с прогрессом и
 * удаление файла. Удаление живого артворка сервер отклоняет с 409 — показываем
 * явное сообщение, а не сырой текст ошибки.
 */
export const useAdminMedia = (): AdminMediaState => {
  const showToastAction = useAction(showToast)
  const [files, setFiles] = useState<APITypes.FileMetadataDto[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isError, setIsError] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [progress, setProgress] = useState(0)
  const [reloadToken, setReloadToken] = useState(0)

  useEffect(() => {
    let isActive = true

    const load = async () => {
      setIsLoading(true)
      setIsError(false)
      try {
        const response = await filesApi.getFiles().getFiles()
        if (isActive) setFiles(response.files)
      } catch (error) {
        if (isActive) {
          setIsError(true)
          reportError(error, LOAD_ERROR_MESSAGE)
        }
      } finally {
        if (isActive) setIsLoading(false)
      }
    }

    void load()

    return () => {
      isActive = false
    }
  }, [reloadToken])

  const reload = useCallback(() => setReloadToken(token => token + 1), [])

  const reloadQuietly = useCallback(async () => {
    try {
      const response = await filesApi.getFiles().getFiles()
      setFiles(response.files)
    } catch (error) {
      reportError(error, LOAD_ERROR_MESSAGE)
    }
  }, [])

  const upload = useCallback(
    async (asset: PickedUploadAsset, onUpload: (fileName: string) => void) => {
      if (isUploading) return

      setIsUploading(true)
      setProgress(0)
      try {
        const uploaded = await uploadSermonFile(asset, { onProgress: setProgress })
        onUpload(uploaded.fileName)
        showToastAction(UPLOAD_SUCCESS_MESSAGE)
        await reloadQuietly()
      } catch (error) {
        showToastAction(getErrorMessage(error))
      } finally {
        setIsUploading(false)
        setProgress(0)
      }
    },
    [isUploading, reloadQuietly, showToastAction],
  )

  const remove = useCallback(
    async (file: APITypes.FileMetadataDto) => {
      setIsDeleting(true)
      try {
        await filesApi.getFiles().appControllerRemoveFile(file.fileName)
        showToastAction(DELETE_SUCCESS_MESSAGE)
        await reloadQuietly()
      } catch (error) {
        showToastAction(
          getHttpStatus(error) === HTTP_CONFLICT ? DELETE_IN_USE_MESSAGE : getErrorMessage(error),
        )
      } finally {
        setIsDeleting(false)
      }
    },
    [reloadQuietly, showToastAction],
  )

  return {
    files,
    isDeleting,
    isError,
    isLoading,
    isUploading,
    progress,
    reload,
    remove,
    upload,
  }
}
