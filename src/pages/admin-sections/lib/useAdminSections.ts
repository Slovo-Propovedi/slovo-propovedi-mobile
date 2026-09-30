import { useAction } from '@reatom/npm-react'
import { useCallback, useEffect, useState } from 'react'
import { type APITypes, sectionsApi } from 'shared/api'
import { getErrorMessage } from 'shared/lib/error-utils'
import { hasOrderChanged } from 'shared/lib/utils/hasOrderChanged'
import { showToast } from 'shared/model'
import { reportError } from 'shared/model/error-dialog'

export interface AdminSectionsState {
  isLoading: boolean
  isReordering: boolean
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
  const [isReordering, setIsReordering] = useState(false)

  useEffect(() => {
    let isActive = true

    const load = async () => {
      try {
        const response = await sectionsApi.getSections().sectionControllerFindAll()
        if (isActive) setSections(response.sections)
      } catch (error) {
        reportError(error, LOAD_ERROR_MESSAGE)
      } finally {
        if (isActive) setIsLoading(false)
      }
    }

    void load()

    return () => {
      isActive = false
    }
  }, [])

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

  return { isLoading, isReordering, reorder, sections }
}
