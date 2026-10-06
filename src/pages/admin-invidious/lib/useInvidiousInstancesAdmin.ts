import { useAction } from '@reatom/npm-react'
import { useCallback, useEffect, useState } from 'react'
import { invidiousApi } from 'shared/api'
import { showToast } from 'shared/model'
import { reportError } from 'shared/model/error-dialog'
import { type AddInstanceResult, validateInstanceUrl } from './instanceUrl'

const LOAD_ERROR_MESSAGE = 'Не удалось загрузить источники импорта'
const SAVE_ERROR_MESSAGE = 'Не удалось сохранить источники импорта'
const SAVED_MESSAGE = 'Источники импорта сохранены'

interface InvidiousInstancesAdminState {
  addUrl: (url: string) => AddInstanceResult
  instances: string[]
  isDirty: boolean
  isLoading: boolean
  isSaving: boolean
  loadFailed: boolean
  removeUrl: (url: string) => void
  save: () => Promise<boolean>
}

const areEqual = (first: readonly string[], second: readonly string[]): boolean =>
  first.length === second.length && first.every((value, index) => value === second[index])

/**
 * Состояние экрана «Источники импорта»: загрузка списка (`GET`), правки в
 * памяти (добавление/удаление) и сохранение полной заменой (`PUT`). Список —
 * обычный массив адресов: id серверу нужны только как ключ, а уникальность
 * url делает его же стабильным ключом строки.
 */
export const useInvidiousInstancesAdmin = (): InvidiousInstancesAdminState => {
  const showToastAction = useAction(showToast)
  const [instances, setInstances] = useState<string[]>([])
  const [savedInstances, setSavedInstances] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [loadFailed, setLoadFailed] = useState(false)

  useEffect(() => {
    let isMounted = true

    const load = async () => {
      try {
        const response = await invidiousApi.getInvidious().invidiousInstancesControllerFindAll()
        if (!isMounted) return

        const urls = response.map(instance => instance.url)
        setInstances(urls)
        setSavedInstances(urls)
      } catch (error) {
        if (!isMounted) return
        setLoadFailed(true)
        reportError(error, LOAD_ERROR_MESSAGE)
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    void load()

    return () => {
      isMounted = false
    }
  }, [])

  const addUrl = useCallback(
    (url: string): AddInstanceResult => {
      const result = validateInstanceUrl(url, instances)
      if (result === 'ok') setInstances(previous => [...previous, url.trim()])

      return result
    },
    [instances],
  )

  const removeUrl = useCallback((url: string) => {
    setInstances(previous => previous.filter(instance => instance !== url))
  }, [])

  const save = useCallback(async (): Promise<boolean> => {
    setIsSaving(true)
    try {
      const response = await invidiousApi
        .getInvidious()
        .invidiousInstancesControllerReplace({ urls: instances })

      const saved = response.map(instance => instance.url)
      setInstances(saved)
      setSavedInstances(saved)
      showToastAction(SAVED_MESSAGE)

      return true
    } catch (error) {
      reportError(error, SAVE_ERROR_MESSAGE)

      return false
    } finally {
      setIsSaving(false)
    }
  }, [instances, showToastAction])

  return {
    addUrl,
    instances,
    isDirty: !areEqual(instances, savedInstances),
    isLoading,
    isSaving,
    loadFailed,
    removeUrl,
    save,
  }
}
