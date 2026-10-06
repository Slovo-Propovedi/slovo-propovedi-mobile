import { useAction } from '@reatom/npm-react'
import { useCallback, useState } from 'react'
import { type APITypes, filesApi, type PickedUploadAsset, uploadSermonFile } from 'shared/api'
import { getErrorMessage, getHttpStatus } from 'shared/lib/error-utils'
import { showToast } from 'shared/model'

interface AdminMediaMutations {
  isDeleting: boolean
  isUploading: boolean
  progress: number
  remove: (file: APITypes.FileMetadataDto) => Promise<void>
  upload: (asset: PickedUploadAsset, onUpload: (fileName: string) => void) => Promise<void>
}

const DELETE_SUCCESS_MESSAGE = 'Обложка удалена'
const UPLOAD_SUCCESS_MESSAGE = 'Обложка загружена'
const DELETE_IN_USE_MESSAGE = 'Обложка используется в проповедях/плейлистах'
const HTTP_CONFLICT = 409

/**
 * Upload/delete mutations for the media catalog. A live artwork is rejected by
 * the server with 409, so a dedicated message is shown instead of the raw error.
 * Both mutations refetch the catalog silently after success.
 * @param reloadQuietly - Refetches the catalog without toggling the skeleton.
 * @returns Mutation state and handlers.
 */
export const useAdminMediaMutations = (reloadQuietly: () => Promise<void>): AdminMediaMutations => {
  const showToastAction = useAction(showToast)
  const [isUploading, setIsUploading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [progress, setProgress] = useState(0)

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

  return { isDeleting, isUploading, progress, remove, upload }
}
