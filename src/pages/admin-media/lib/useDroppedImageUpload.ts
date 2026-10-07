import { useAction } from '@reatom/npm-react'
import { useCallback } from 'react'
import { detectFileKind, getFileKindConfig, isAllowedExtension } from 'widgets/admin-form-pickers'
import { type PickedUploadAsset } from 'shared/api'
import { showToast } from 'shared/model'

const NOOP_UPLOAD_CALLBACK = () => undefined

const isDroppedImage = (file: File) =>
  detectFileKind(file.name, file.type) === 'image' && isAllowedExtension('image', file.name)

/**
 * Загружает изображение, брошенное на каталог медиа: берёт первое изображение из
 * пачки (остальные файлы игнорируются молча) и грузит его тем же `upload`, что и
 * кнопка «Загрузить». Если среди брошенных файлов изображений нет — показывает
 * сообщение об отказе. Пока идёт загрузка, повторный дроп игнорируется.
 * @param upload - Загрузчик каталога (`useAdminMedia().upload`).
 * @param isUploading - Признак активной загрузки: дроп в это время не стартует.
 */
export const useDroppedImageUpload = (
  upload: (asset: PickedUploadAsset, onUpload: (fileName: string) => void) => Promise<void>,
  isUploading: boolean,
) => {
  const showToastAction = useAction(showToast)

  const handleFiles = useCallback(
    async (files: File[]) => {
      if (isUploading) return
      if (files.length === 0) return

      const image = files.find(isDroppedImage)
      if (!image) {
        showToastAction(getFileKindConfig('image').rejectMessage)
        return
      }

      const objectUrl = URL.createObjectURL(image)
      try {
        await upload(
          { mimeType: image.type, name: image.name, size: image.size, uri: objectUrl },
          NOOP_UPLOAD_CALLBACK,
        )
      } finally {
        URL.revokeObjectURL(objectUrl)
      }
    },
    [isUploading, showToastAction, upload],
  )

  return { handleFiles }
}
