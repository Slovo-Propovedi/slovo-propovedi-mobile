import { useEffect, useState } from 'react'
import { invidiousApi } from 'shared/api'
import { DEFAULT_INVIDIOUS_BASE_URL } from './importSettings'

const FALLBACK_INSTANCES: readonly string[] = [DEFAULT_INVIDIOUS_BASE_URL]

/**
 * Пресеты Invidious-инстансов для формы импорта. Список — админ-управляемый и
 * живёт на бэкенде (`GET /invidious-instances`). Пока запрос в полёте или если
 * он упал (старый бэкенд отвечает 404, сеть недоступна), показываем единственный
 * встроенный дефолт — форма импорта обязана работать даже без свежего бэкенда.
 * Пустой ответ сервера тоже оставляет дефолт: список без пресетов бесполезен.
 */
export const useInvidiousInstances = (): readonly string[] => {
  const [instances, setInstances] = useState<readonly string[]>(FALLBACK_INSTANCES)

  useEffect(() => {
    let isMounted = true

    const load = async () => {
      try {
        const response = await invidiousApi.getInvidious().invidiousInstancesControllerFindAll()
        if (!isMounted) return

        const urls = response.map(instance => instance.url)
        if (urls.length > 0) setInstances(urls)
      } catch (error) {
        console.warn('Failed to load invidious instances, using default', error)
      }
    }

    void load()

    return () => {
      isMounted = false
    }
  }, [])

  return instances
}
