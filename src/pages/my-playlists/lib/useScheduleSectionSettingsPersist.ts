import { useAction } from '@reatom/npm-react'
import { persistSectionSettings } from 'entities/playlist'
import { useDebounce } from 'shared/lib/hooks/useDebounce'

// Гейт записи настроек оформления: одна запись в AsyncStorage за период
// тишины вместо записи на каждое нажатие клавиши. Атом коммитится сразу
// (`updateSectionSettings`), здесь планируется только запись в хранилище.
const PERSIST_DEBOUNCE_MS = 500

/**
 * Запись текущего значения `sectionSettingsAtom` с trailing-дебаунсом.
 *
 * Возвращает дебаунс-шедулер с `.flush()`. Хук — `flushOnUnmount`, поэтому
 * отложенная запись переживает уход с формы; вызывающий также флашит на blur
 * поля, чтобы записать данные до перехода фокуса на другое поле.
 */
export const useScheduleSectionSettingsPersist = () => {
  const persist = useAction(persistSectionSettings)

  return useDebounce(() => void persist(), PERSIST_DEBOUNCE_MS, [persist], {
    flushOnUnmount: true,
  })
}
