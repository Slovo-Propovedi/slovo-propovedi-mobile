import { useCallback, useEffect, useRef, useState } from 'react'
import z from 'zod'
import { getCachedJson, setCachedJson } from 'shared/lib/cache'
import { type ImportSettings } from './importTypes'

// Настройки импорта живут в одном ключе: при смене источника или адреса
// инстанса перезаписывается весь объект. Ключ объявлен здесь, а не в
// shared/config, потому что принадлежит только этой фиче.
const YOUTUBE_IMPORT_SETTINGS = 'youtube_import_settings'

const DEFAULT_INVIDIOUS_BASE_URL = 'https://inv.phobos.observer'

// Свой инстанс часто поднимают в локальной сети и вводят без схемы («192.168.1.10:8080»),
// но хранить такой адрес нельзя: fetch без схемы не разберёт хост. Нормализуем адрес
// на границе ввода (в коммиенте поля), поэтому в хранилище попадает только URL,
// со схемой; схема в zod-схеме ниже остаётся страховкой для чужих/битых данных.
const URL_WITH_SCHEME = /^https?:\/\//i
const FALLBACK_SCHEME = 'http://'

/**
 * Приводит введённый адрес инстанса к URL со схемой: пустое значение и уже
 * готовый URL меняет только схему, хвостовые слэши убирает.
 * @param invidiousBaseUrl - Адрес инстанса, введённый администратором.
 */
export const normalizeInvidiousBaseUrl = (invidiousBaseUrl: string): string => {
  const trimmed = invidiousBaseUrl.trim()

  if (!trimmed) return ''
  const withScheme = URL_WITH_SCHEME.test(trimmed) ? trimmed : `${FALLBACK_SCHEME}${trimmed}`

  return withScheme.replace(/\/+$/, '')
}

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
  // Последние известные настройки держим ещё и в ref: апдейтер state обязан быть
  // чистым (никаких записей в хранилище внутри setSettings), а сохранять нужно уже
  // посчитанное значение. Пишет ref только код фичи — загрузка при монтировании и
  // updateSettings, поэтому база патча всегда актуальна.
  const settingsRef = useRef<ImportSettings>(DEFAULT_SETTINGS)

  useEffect(() => {
    let isMounted = true

    const load = async () => {
      const stored = await loadImportSettings()
      if (!isMounted) return
      settingsRef.current = stored
      setSettings(stored)
    }
    void load()

    return () => {
      isMounted = false
    }
  }, [])

  const updateSettings = useCallback((patch: Partial<ImportSettings>) => {
    let next: ImportSettings = settingsRef.current

    if (patch.invidiousBaseUrl !== undefined) {
      const normalized = normalizeInvidiousBaseUrl(patch.invidiousBaseUrl)
      // Храним в хранилище нормализованное значение: пустой адрес не валиден по
      // схеме, поэтому сохраняем только когда нормализация дала непустой результат.
      if (normalized === '') return
      next = { ...settingsRef.current, invidiousBaseUrl: normalized }
    }

    if (patch.source !== undefined) next = { ...next, source: patch.source }

    settingsRef.current = next
    setSettings(next)
    void saveImportSettings(next)
  }, [])

  return { settings, updateSettings }
}
