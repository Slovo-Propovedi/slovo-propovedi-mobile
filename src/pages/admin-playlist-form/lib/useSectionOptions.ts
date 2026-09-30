import { useEffect, useState } from 'react'
import { type APITypes, sectionsApi } from 'shared/api'

export interface SectionOptionsState {
  isError: boolean
  isLoading: boolean
  sections: APITypes.SectionEntity[]
}

/** Полный список разделов для чекбокс-пикера формы плейлиста. */
export const useSectionOptions = (): SectionOptionsState => {
  const [sections, setSections] = useState<APITypes.SectionEntity[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isError, setIsError] = useState(false)

  useEffect(() => {
    let isActive = true

    const load = async () => {
      try {
        const response = await sectionsApi.getSections().sectionControllerFindAll()
        if (isActive) setSections(response.sections)
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

  return { isError, isLoading, sections }
}
