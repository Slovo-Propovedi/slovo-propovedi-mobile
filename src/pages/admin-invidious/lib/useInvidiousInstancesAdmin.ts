import { useAction } from '@reatom/npm-react'
import { useCallback, useEffect, useState } from 'react'
import { invidiousApi } from 'shared/api'
import { showToast } from 'shared/model'
import { reportError } from 'shared/model/error-dialog'

const LOAD_ERROR_MESSAGE = 'Не удалось загрузить источники импорта'
const SAVE_ERROR_MESSAGE = 'Не удалось сохранить источники импорта'
const SAVED_MESSAGE = 'Источники импорта сохранены'

interface InvidiousInstancesAdminState {
  addAndSave: (url: string) => Promise<void>
  instances: string[]
  isDirty: boolean
  isLoading: boolean
  isSaving: boolean
  loadFailed: boolean
  removeUrl: (url: string) => void
  save: () => Promise<void>
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

  // Полная замена списка (`PUT`) — единственный путь сохранения правок.
  const putInstances = useCallback(
    async (next: string[]): Promise<void> => {
      setIsSaving(true)
      try {
        const response = await invidiousApi
          .getInvidious()
          .invidiousInstancesControllerReplace({ urls: next })

        const saved = response.map(instance => instance.url)
        setInstances(saved)
        setSavedInstances(saved)
        showToastAction(SAVED_MESSAGE)
      } catch (error) {
        reportError(error, SAVE_ERROR_MESSAGE)
      } finally {
        setIsSaving(false)
      }
    },
    [showToastAction],
  )

  const save = useCallback((): Promise<void> => putInstances(instances), [instances, putInstances])

  // Добавление сразу сохраняет список: админ не должен забыть нажать
  // «Сохранить», а неудачный PUT оставляет локальную правку (isDirty).
  const addAndSave = useCallback(
    async (url: string): Promise<void> => {
      const next = [...instances, url.trim()]
      setInstances(next)
      await putInstances(next)
    },
    [instances, putInstances],
  )

  const removeUrl = useCallback((url: string) => {
    setInstances(previous => previous.filter(instance => instance !== url))
  }, [])

  return {
    addAndSave,
    instances,
    isDirty: !areEqual(instances, savedInstances),
    isLoading,
    isSaving,
    loadFailed,
    removeUrl,
    save,
  }
}
