import { useEffect, useState } from 'react'
import { type APITypes, filesApi } from 'shared/api'
import { type AdminFileKind, getFileKindConfig } from './fileKinds'

export interface AdminFilesState {
  files: APITypes.FileMetadataDto[]
  isError: boolean
  isLoading: boolean
}

/**
 * Каталог библиотеки файлов (`GET /files`), отфильтрованный по виду: аудио,
 * изображения или текстовые документы. Сервер отдаёт все файлы, фильтр по
 * расширению оставляет нужный вид.
 * @param kind - Вид файла для фильтрации.
 */
export const useAdminFiles = (kind: AdminFileKind): AdminFilesState => {
  const [files, setFiles] = useState<APITypes.FileMetadataDto[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isError, setIsError] = useState(false)

  useEffect(() => {
    let isActive = true
    const { libraryPattern } = getFileKindConfig(kind)

    const load = async () => {
      try {
        const response = await filesApi.getFiles().getFiles()
        if (isActive) setFiles(response.files.filter(file => libraryPattern.test(file.fileUrl)))
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
  }, [kind])

  return { files, isError, isLoading }
}
