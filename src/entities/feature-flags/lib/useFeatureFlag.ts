import { useAtom } from '@reatom/npm-react'
import { featureFlagsAtom } from '../model'

// Пока флаги не загружены (нет токена, запрос в полёте, ошибка) запись равна
// null, поэтому доступ закрыт: отсутствующий ключ тоже даёт false. Это
// безопасный дефолт для гейтед-табов «Читать»/«Учиться».
export const useFeatureFlag = (key: string): boolean => {
  const [flags] = useAtom(featureFlagsAtom)

  return flags?.[key] ?? false
}
