import { useEffect, useState } from 'react'
import { type APITypes, sectionsApi } from 'shared/api'
import { reportError } from 'shared/model/error-dialog'

export interface AdminSectionEntityState {
  isLoading: boolean
  isNotFound: boolean
  section: APITypes.SectionEntity | null
}

const LOAD_ERROR_MESSAGE = 'Не удалось загрузить раздел'

/**
 * Загрузка одного раздела для формы редактирования (стабильные пропсы формы).
 * @param id — идентификатор раздела.
 */
export const useAdminSectionEntity = (id: string): AdminSectionEntityState => {
  const [section, setSection] = useState<APITypes.SectionEntity | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isNotFound, setIsNotFound] = useState(false)

  useEffect(() => {
    let isActive = true

    const load = async () => {
      if (!id) {
        setIsNotFound(true)
        setIsLoading(false)
        return
      }

      try {
        const entity = await sectionsApi.getSections().sectionControllerFindOne(id)
        if (isActive) setSection(entity)
      } catch (error) {
        if (isActive) {
          setIsNotFound(true)
          reportError(error, LOAD_ERROR_MESSAGE)
        }
      } finally {
        if (isActive) setIsLoading(false)
      }
    }

    void load()

    return () => {
      isActive = false
    }
  }, [id])

  return { isLoading, isNotFound, section }
}
