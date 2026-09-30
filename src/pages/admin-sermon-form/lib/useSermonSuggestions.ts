import { useEffect, useState } from 'react'
import { sermonsApi } from 'shared/api'

export interface SermonSuggestionsState {
  artists: string[]
  books: string[]
}

const EMPTY_SUGGESTIONS: SermonSuggestionsState = { artists: [], books: [] }

/**
 * Ранее использованные проповедники и книги (`GET /sermons/distinct-values`)
 * для автодополнения полей формы. Ошибка загрузки тихо деградирует к пустому
 * списку — подсказки необязательны и не должны блокировать заполнение.
 */
export const useSermonSuggestions = (): SermonSuggestionsState => {
  const [suggestions, setSuggestions] = useState<SermonSuggestionsState>(EMPTY_SUGGESTIONS)

  useEffect(() => {
    let isActive = true

    const load = async () => {
      try {
        const response = await sermonsApi.getSermons().sermonControllerGetDistinctValues()
        if (isActive) setSuggestions({ artists: response.artists, books: response.books })
      } catch {
        // Подсказки необязательны: пустой список — приемлемый фолбэк.
      }
    }

    void load()

    return () => {
      isActive = false
    }
  }, [])

  return suggestions
}

/**
 * Оставляет подсказки, которые начинаются с введённого текста (без учёта
 * регистра), исключая точное совпадение с текущим значением. Пустой ввод
 * подсказок не показывает.
 * @param options - Полный список подсказок.
 * @param value - Текущее значение поля.
 */
export const filterSuggestions = (options: string[], value: string): string[] => {
  const term = value.trim().toLowerCase()
  if (term === '') return []

  return options.filter(option => {
    const lower = option.toLowerCase()

    return lower !== term && lower.includes(term)
  })
}
