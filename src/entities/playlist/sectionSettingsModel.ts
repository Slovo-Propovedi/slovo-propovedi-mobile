import { action, atom } from '@reatom/framework'
import { readStoredSectionSettings } from './lib/readStoredSectionSettings'
import { DEFAULT_SECTION_SETTINGS, type LocalSectionSettings } from './localSectionSettings'
import { persistSectionSettings as persistSectionSettingsToStorage } from './localSectionSettingsStorage'

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
 * Только коммит в атом — без записи в хранилище. Запись отделена намеренно:
 * поле «Строк» меняется на каждое нажатие клавиши, и писать в AsyncStorage
 * каждый раз незачем. Вызывающий планирует `persistSectionSettings` через
 * дебаунс (см. `MyPlaylistsAppearanceForm`) и флашит его на blur/unmount.
 */
export const updateSectionSettings = action(async (ctx, patch: Partial<LocalSectionSettings>) => {
  const nextSettings: LocalSectionSettings = { ...ctx.get(sectionSettingsAtom), ...patch }
  await ctx.schedule(() => {
    sectionSettingsAtom(ctx, nextSettings)
  })
  return nextSettings
}, 'updateSectionSettings')

/**
 * Запись текущих настроек оформления в хранилище.
 *
 * Читает актуальное значение атома в момент вызова, поэтому схлопывает
 * серию быстрых изменений в одну запись последнего состояния. Отказ записи
 * логируется, но атом уже закоммичен — та же политика деградации, что у
 * `loadSectionSettings`.
 */
export const persistSectionSettings = action(async ctx => {
  const settings = ctx.get(sectionSettingsAtom)
  try {
    await persistSectionSettingsToStorage(settings)
  } catch (error) {
    console.error('[persistSectionSettings] failed to persist settings:', error)
  }
  return settings
}, 'persistSectionSettings')
