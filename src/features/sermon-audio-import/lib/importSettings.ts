import { useCallback, useEffect, useState } from 'react'
import z from 'zod'
import { getCachedJson, setCachedJson } from 'shared/lib/cache'
import { type ImportSettings } from './importTypes'

// Настройки импорта живут в одном ключе: при смене источника или адреса
// инстанса перезаписывается весь объект. Ключ объявлен здесь, а не в
// shared/config, потому что принадлежит только этой фиче.
const YOUTUBE_IMPORT_SETTINGS = 'youtube_import_settings'

const DEFAULT_INVIDIOUS_BASE_URL = 'https://inv.phobos.observer'

const DEFAULT_SETTINGS: ImportSettings = {
  invidiousBaseUrl: DEFAULT_INVIDIOUS_BASE_URL,
  source: 'invidious',
}

// Значение из хранилища — недоверенный ввод (оно переживает обновления
// приложения), поэтому читаем его через схему, а не доверяя форме. http://
// разрешён: инстанс часто поднимают локально в своей сети.
const importSettingsSchema = z.object({
  invidiousBaseUrl: z.url().refine(url => url.startsWith('http://') || url.startsWith('https://')),
  source: z.enum(['invidious', 'youtube']),
})

/**
 * Читает настройки импорта из хранилища. Отсутствующее или невалидное значение
 * (битый JSON, чужой источник, не-URL адрес) — дефолты в памяти, хранилище при
 * этом не перезаписывается.
 */
export const loadImportSettings = async (): Promise<ImportSettings> => {
  try {
    const stored = await getCachedJson(YOUTUBE_IMPORT_SETTINGS, importSettingsSchema)

    return stored ?? DEFAULT_SETTINGS
  } catch (error) {
    console.warn('Failed to load youtube import settings', error)
    return DEFAULT_SETTINGS
  }
}

const saveImportSettings = async (settings: ImportSettings): Promise<void> => {
  try {
    await setCachedJson(YOUTUBE_IMPORT_SETTINGS, settings)
  } catch (error) {
    console.warn('Failed to save youtube import settings', error)
  }
}

/**
 * Настройки источника импорта с ленивой загрузкой из хранилища: в памяти держим
 * дефолт до монтирования, изменения применяются сразу и пишутся в хранилище без
 * ожидания.
 */
export const useImportSettings = () => {
  const [settings, setSettings] = useState<ImportSettings>(DEFAULT_SETTINGS)

  useEffect(() => {
    let isMounted = true

    const load = async () => {
      const stored = await loadImportSettings()
      if (isMounted) setSettings(stored)
    }
    void load()

    return () => {
      isMounted = false
    }
  }, [])

  const updateSettings = useCallback((patch: Partial<ImportSettings>) => {
    setSettings(current => {
      const next = { ...current, ...patch }
      void saveImportSettings(next)

      return next
    })
  }, [])

  return { settings, updateSettings }
}
