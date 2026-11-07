import { useCallback, useEffect, useState } from 'react'
import { type APITypes, filesApi, type PickedUploadAsset } from 'shared/api'
import { useSilentRefetchOnFocus } from 'shared/lib/hooks/useSilentRefetchOnFocus'
import { loadCacheFirst } from 'shared/lib/session-cache'
import { reportError } from 'shared/model/error-dialog'
import { mediaFilesCache } from './mediaFilesCache'
import { useAdminMediaMutations } from './useAdminMediaMutations'

export interface AdminMediaState {
  files: APITypes.FileMetadataDto[]
  isDeleting: boolean
  isError: boolean
  isLoading: boolean
  isRefreshing: boolean
  isUploading: boolean
  progress: number
  refresh: () => void
  reload: () => void
  remove: (file: APITypes.FileMetadataDto) => Promise<void>
  upload: (asset: PickedUploadAsset, onUpload: (fileName: string) => void) => Promise<void>
}

const LOAD_ERROR_MESSAGE = 'Не удалось загрузить файлы'

const fetchFiles = () =>
  mediaFilesCache.fetchThrough('', () =>
    filesApi
      .getFiles()
      .getFiles()
      .then(response => response.files),
  )

/**
 * Каталог медиа-библиотеки (`GET /files`): загрузка изображения с прогрессом и
 * удаление файла. Удаление живого артворка сервер отклоняет с 409 — показываем
 * явное сообщение, а не сырой текст ошибки.
 */
export const useAdminMedia = (): AdminMediaState => {
  const [files, setFiles] = useState<APITypes.FileMetadataDto[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isError, setIsError] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [reloadToken, setReloadToken] = useState(0)

  useEffect(() => {
    let isActive = true

    const load = async () => {
      setIsLoading(true)
      setIsError(false)
      try {
        const nextFiles = await loadCacheFirst({
          cache: mediaFilesCache,
          cacheKey: '',
          fetcher: fetchFiles,
          onCached: cached => {
            if (!isActive) return
            setFiles(cached)
            setIsLoading(false)
          },
        })
        if (isActive) setFiles(nextFiles)
      } catch (error) {
        if (isActive) {
          setIsError(true)
          reportError(error, LOAD_ERROR_MESSAGE)
        }
      } finally {
        if (isActive) {
          setIsLoading(false)
          setIsRefreshing(false)
        }
      }
    }

    void load()

    return () => {
      isActive = false
    }
  }, [reloadToken])

  const reload = useCallback(() => setReloadToken(token => token + 1), [])

  // Pull-to-refresh: `reload` is synchronous (token bump), so the spinner is
  // cleared by the loader's `finally` once the catalog finishes refetching.
  const refresh = useCallback(() => {
    setIsRefreshing(true)
    reload()
  }, [reload])

  const reloadQuietly = useCallback(async () => {
    try {
      setFiles(await fetchFiles())
    } catch (error) {
      reportError(error, LOAD_ERROR_MESSAGE)
    }
  }, [])
  useSilentRefetchOnFocus(reloadQuietly)

  const mutations = useAdminMediaMutations(reloadQuietly)

  return {
    ...mutations,
    files,
    isError,
    isLoading,
    isRefreshing,
    refresh,
    reload,
  }
}
