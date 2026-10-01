import z from 'zod'

/** Ключ AsyncStorage для настроек оформления секции «Мои плейлисты». */
export const MY_PLAYLISTS_SECTION_SETTINGS = 'myPlaylistsSectionSettings'

/**
 * Черновик настроек оформления на границе хранилища.
 *
 * Все поля опциональны: старые/частичные записи дочитываются до канонического
 * вида через `normalizeSectionSettings`, недостающие поля получают дефолт.
 */
export const sectionSettingsDraftSchema = z.object({
  borderRadius: z.boolean().optional(),
  isDescriptionTitleOnSlideLarge: z.boolean().optional(),
  itemsRows: z.number().nullable().optional(),
  itemsSize: z.enum(['small', 'middle', 'large', 'xLarge']).optional(),
  transform: z.enum(['high', 'middle', 'short']).optional(),
  whereIsSlideTitleLocated: z.enum(['bothOnAndUnder', 'on', 'under']).optional(),
})

/** Настройки оформления секции «Мои плейлисты» (имена полей как у DTO секции). */
export interface LocalSectionSettings {
  borderRadius: boolean
  isDescriptionTitleOnSlideLarge: boolean
  itemsRows: null | number
  itemsSize: 'large' | 'middle' | 'small' | 'xLarge'
  transform: 'high' | 'middle' | 'short'
  whereIsSlideTitleLocated: 'bothOnAndUnder' | 'on' | 'under'
}

/** Дефолт = текущий вид секции до появления настроек. */
export const DEFAULT_SECTION_SETTINGS: LocalSectionSettings = {
  borderRadius: false,
  isDescriptionTitleOnSlideLarge: false,
  itemsRows: null,
  itemsSize: 'small',
  transform: 'middle',
  whereIsSlideTitleLocated: 'under',
}

/**
 * Приводит прочитанные (недоверенные) настройки к каноническому виду.
 * Отсутствующие поля берут дефолт, поэтому старые записи читаются без падения.
 * @param draft - Сырые данные из схемы (untrusted).
 * @returns Настройки с гарантированными полями.
 */
export const normalizeSectionSettings = (
  draft: z.infer<typeof sectionSettingsDraftSchema>,
): LocalSectionSettings => ({
  borderRadius: draft.borderRadius ?? DEFAULT_SECTION_SETTINGS.borderRadius,
  isDescriptionTitleOnSlideLarge:
    draft.isDescriptionTitleOnSlideLarge ?? DEFAULT_SECTION_SETTINGS.isDescriptionTitleOnSlideLarge,
  itemsRows: draft.itemsRows ?? DEFAULT_SECTION_SETTINGS.itemsRows,
  itemsSize: draft.itemsSize ?? DEFAULT_SECTION_SETTINGS.itemsSize,
  transform: draft.transform ?? DEFAULT_SECTION_SETTINGS.transform,
  whereIsSlideTitleLocated:
    draft.whereIsSlideTitleLocated ?? DEFAULT_SECTION_SETTINGS.whereIsSlideTitleLocated,
})
