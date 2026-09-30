import { getDocumentAsync } from 'expo-document-picker'
import { useCallback } from 'react'
import { getFileKindConfig, isAllowedExtension } from 'widgets/admin-form-pickers'
import { type PickedUploadAsset } from 'shared/api'

export interface PickImageState {
  pickImage: () => Promise<void>
}

/**
 * Системный пикер изображений для каталога медиа: проверяет расширение и
 * передаёт выбранный ассет наверх (загрузка — ответственность вызывающего).
 * @param onPicked - Потребитель выбранного изображения.
 * @param onRejected - Уведомление об отказе по расширению.
 */
export const usePickImage = (
  onPicked: (asset: PickedUploadAsset) => void,
  onRejected: (message: string) => void,
): PickImageState => {
  const pickImage = useCallback(async () => {
    const { mimeTypes, rejectMessage } = getFileKindConfig('image')
    const result = await getDocumentAsync({
      copyToCacheDirectory: true,
      multiple: false,
      type: mimeTypes,
    })
    if (result.canceled) return

    const asset = result.assets[0]
    if (!isAllowedExtension('image', asset.name)) {
      onRejected(rejectMessage)
      return
    }

    onPicked(asset)
  }, [onPicked, onRejected])

  return { pickImage }
}
