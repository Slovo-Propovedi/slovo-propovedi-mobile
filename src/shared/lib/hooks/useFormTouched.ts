import { useCallback, useState } from 'react'

export type TouchedMap<K extends string> = Partial<Record<K, boolean>>

/**
 * Отслеживает, каких обязательных полей пользователь уже касался. Поле
 * становится «тронутым» при потере фокуса или попытке отправки, после чего
 * пустое обязательное поле можно подсветить красным, не показывая ошибку на
 * ещё не заполненной pristine-форме.
 * @returns Карта тронутых полей и обработчики отметки.
 */
export const useFormTouched = <K extends string>() => {
  const [touched, setTouched] = useState<TouchedMap<K>>({})

  const markTouched = useCallback((key: K) => {
    setTouched(prev => (prev[key] ? prev : { ...prev, [key]: true }))
  }, [])

  const markAllTouched = useCallback((keys: readonly K[]) => {
    setTouched(prev => {
      const next = { ...prev }
      for (const key of keys) next[key] = true
      return next
    })
  }, [])

  return { markAllTouched, markTouched, touched }
}
