import { useAction } from '@reatom/npm-react'
import { getDocumentAsync } from 'expo-document-picker'
import { useCallback, useState } from 'react'
import { uploadSermonFile } from 'shared/api'
import { getErrorMessage } from 'shared/lib/error-utils'
import { showToast } from 'shared/model'
import {
  type AdminFileKind,
  getFileKindConfig,
  getFileKindSuccessMessage,
  isAllowedExtension,
} from './fileKinds'

export interface FileUploadState {
  error: null | string
  isUploading: boolean
  pickAndUpload: () => Promise<void>
  progress: number
}

/**
 * Загрузка файла в форме админки: системный пикер документов, проверка
 * расширения и multipart-загрузка с прогрессом. После успеха отдаёт URL наверх
 * через `onUploaded`.
 * @param kind - Вид файла (ограничивает расширения и пикер).
 * @param onUploaded - Потребитель URL загруженного файла.
 */
export const useFileUpload = (
  kind: AdminFileKind,
  onUploaded: (url: string) => void,
): FileUploadState => {
  const showToastAction = useAction(showToast)
  const [isUploading, setIsUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<null | string>(null)

  const pickAndUpload = useCallback(async () => {
    if (isUploading) return

    setError(null)

    const { mimeTypes, rejectMessage } = getFileKindConfig(kind)
    const result = await getDocumentAsync({
      copyToCacheDirectory: true,
      multiple: false,
      type: mimeTypes,
    })
    if (result.canceled) return

    const asset = result.assets[0]
    if (!isAllowedExtension(kind, asset.name)) {
      setError(rejectMessage)
      showToastAction(rejectMessage)
      return
    }

    setIsUploading(true)
    setProgress(0)
    try {
      const uploaded = await uploadSermonFile(asset, { onProgress: setProgress })
      onUploaded(uploaded.fileUrl)
      showToastAction(getFileKindSuccessMessage(kind))
    } catch (uploadError) {
      const message = getErrorMessage(uploadError)
      setError(message)
      showToastAction(message)
    } finally {
      setIsUploading(false)
      setProgress(0)
    }
  }, [isUploading, kind, onUploaded, showToastAction])

  return { error, isUploading, pickAndUpload, progress }
}
