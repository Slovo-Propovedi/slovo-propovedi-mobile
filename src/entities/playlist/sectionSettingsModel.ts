import { action, atom } from '@reatom/framework'
import { readStoredSectionSettings } from './lib/readStoredSectionSettings'
import { DEFAULT_SECTION_SETTINGS, type LocalSectionSettings } from './localSectionSettings'
import { persistSectionSettings } from './localSectionSettingsStorage'

/** Настройки оформления секции «Мои плейлисты»; засеяны дефолтом. */
export const sectionSettingsAtom = atom<LocalSectionSettings>(
  DEFAULT_SECTION_SETTINGS,
  'sectionSettingsAtom',
)

/**
 * Гидратация настроек оформления из AsyncStorage.
 *
 * Хранилище недоверенное: читается через zod (`sectionSettingsDraftSchema`),
 * невалидные данные трактуются как отсутствующие (дефолт). При первом чтении
 * (ключ отсутствует) дефолт персистится. Отказ хранилища логируется и
 * трактуется так же — как отсутствие данных.
 */
export const loadSectionSettings = action(async ctx => {
  const settings = await readStoredSectionSettings()
  await ctx.schedule(() => {
    sectionSettingsAtom(ctx, settings)
  })
  return settings
}, 'loadSectionSettings')

/**
 * Мгновенное применение настроек оформления (instant-apply на экране).
 *
 * Коммит в атом идёт **до** записи в хранилище; отказ записи логируется, но
 * атом уже закоммичен — та же политика деградации, что у `loadSectionSettings`.
 */
export const updateSectionSettings = action(async (ctx, patch: Partial<LocalSectionSettings>) => {
  const nextSettings: LocalSectionSettings = { ...ctx.get(sectionSettingsAtom), ...patch }
  await ctx.schedule(() => {
    sectionSettingsAtom(ctx, nextSettings)
  })
  try {
    await persistSectionSettings(nextSettings)
  } catch (error) {
    console.error('[updateSectionSettings] failed to persist settings:', error)
  }
  return nextSettings
}, 'updateSectionSettings')
