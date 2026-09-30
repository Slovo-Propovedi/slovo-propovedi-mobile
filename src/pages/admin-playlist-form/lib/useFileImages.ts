import { useEffect, useState } from 'react'
import { type APITypes, filesApi } from 'shared/api'

export interface FileImagesState {
  files: APITypes.FileMetadataDto[]
  isError: boolean
  isLoading: boolean
}

const IMAGE_EXTENSION_PATTERN = /\.(jpe?g|png|webp)(\?.*)?$/i

/**
 * Каталог изображений из библиотеки файлов (`GET /files`) для выбора обложки.
 * Сервер отдаёт все файлы; фильтр по расширению оставляет только изображения.
 */
export const useFileImages = (): FileImagesState => {
  const [files, setFiles] = useState<APITypes.FileMetadataDto[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isError, setIsError] = useState(false)

  useEffect(() => {
    let isActive = true

    const load = async () => {
      try {
        const response = await filesApi.getFiles().getFiles()
        if (isActive)
          setFiles(response.files.filter(file => IMAGE_EXTENSION_PATTERN.test(file.fileUrl)))
      } catch {
        if (isActive) setIsError(true)
      } finally {
        if (isActive) setIsLoading(false)
      }
    }

    void load()

    return () => {
      isActive = false
    }
  }, [])

  return { files, isError, isLoading }
}
