import { useAction } from '@reatom/npm-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { type APITypes, sectionsApi } from 'shared/api'
import { getErrorMessage } from 'shared/lib/error-utils'
import { useSilentRefetchOnFocus } from 'shared/lib/hooks/useSilentRefetchOnFocus'
import { hasOrderChanged } from 'shared/lib/utils/hasOrderChanged'
import { showToast } from 'shared/model'
import { reportError } from 'shared/model/error-dialog'

export interface AdminSectionsState {
  isLoading: boolean
  isRefreshing: boolean
  isReordering: boolean
  reload: () => Promise<void>
  reorder: (nextOrder: APITypes.SectionEntity[]) => Promise<void>
  sections: APITypes.SectionEntity[]
}

const REORDER_SUCCESS_MESSAGE = 'Порядок разделов сохранён'
const LOAD_ERROR_MESSAGE = 'Не удалось загрузить разделы'

/** Список разделов админки: загрузка и оптимистичный reorder с откатом. */
export const useAdminSections = (): AdminSectionsState => {
  const showToastAction = useAction(showToast)
  const [sections, setSections] = useState<APITypes.SectionEntity[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isReordering, setIsReordering] = useState(false)

  const generationRef = useRef(0)

  const fetchSections = useCallback(
    () =>
      sectionsApi
        .getSections()
        .sectionControllerFindAll()
        .then(response => response.sections),
    [],
  )

  useEffect(() => {
    let isActive = true
    const generation = ++generationRef.current

    fetchSections()
      .then(nextSections => {
        if (isActive && generationRef.current === generation) setSections(nextSections)
      })
      .catch(error => {
        if (isActive && generationRef.current === generation) reportError(error, LOAD_ERROR_MESSAGE)
      })
      .finally(() => {
        if (isActive) setIsLoading(false)
      })

    return () => {
      isActive = false
    }
  }, [fetchSections])

  useSilentRefetchOnFocus(
    useCallback(async () => {
      const generation = ++generationRef.current
      try {
        const nextSections = await fetchSections()
        if (generationRef.current === generation) setSections(nextSections)
      } catch (error) {
        if (generationRef.current === generation) reportError(error, LOAD_ERROR_MESSAGE)
      }
    }, [fetchSections]),
  )

  const reload = useCallback(async () => {
    const generation = ++generationRef.current
    setIsRefreshing(true)
    try {
      const nextSections = await fetchSections()
      if (generationRef.current === generation) setSections(nextSections)
    } catch (error) {
      if (generationRef.current === generation) reportError(error, LOAD_ERROR_MESSAGE)
    } finally {
      setIsRefreshing(false)
    }
  }, [fetchSections])

  const reorder = useCallback(
    async (nextOrder: APITypes.SectionEntity[]) => {
      const previousOrder = sections
      setSections(nextOrder)

      if (!hasOrderChanged(previousOrder, nextOrder)) return

      setIsReordering(true)
      try {
        await sectionsApi.getSections().reorderSections({ ids: nextOrder.map(s => s.id) })
        showToastAction(REORDER_SUCCESS_MESSAGE)
      } catch (error) {
        setSections(previousOrder)
        showToastAction(getErrorMessage(error))
      } finally {
        setIsReordering(false)
      }
    },
    [sections, showToastAction],
  )

  return { isLoading, isRefreshing, isReordering, reload, reorder, sections }
}
