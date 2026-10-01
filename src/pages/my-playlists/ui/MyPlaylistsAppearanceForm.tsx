import { useState } from 'react'
import { type LocalSectionSettings } from 'entities/playlist'
import { parseItemsRows } from 'shared/lib/utils/parseItemsRows'
import { CheckboxField, FormField, SelectField } from 'shared/ui/form'
import {
  ITEMS_SIZE_OPTIONS,
  SLIDE_TITLE_LOCATION_OPTIONS,
  TRANSFORM_OPTIONS,
} from '../lib/myPlaylistsSectionOptions'
import { useScheduleSectionSettingsPersist } from '../lib/useScheduleSectionSettingsPersist'

const ITEMS_SIZE_LABEL = 'Размер карточек'
const TRANSFORM_LABEL = 'Высота карточек'
const SLIDE_TITLE_LOCATION_LABEL = 'Расположение заголовка'
const ITEMS_ROWS_LABEL = 'Строк'
const ITEMS_ROWS_HINT = 'Необязательно.'
const ITEMS_ROWS_PLACEHOLDER = 'Например: 2'
const LARGE_DESCRIPTION_TITLE_LABEL = 'Крупный заголовок описания на слайде'
const BORDER_RADIUS_LABEL = 'Скруглённые углы карточек'

const toItemsRowsText = (itemsRows: null | number) => (itemsRows == null ? '' : String(itemsRows))

// Блок «Оформление» режима редактирования «Мои плейлисты»: те же поля, что у
// формы раздела в админке, но без названия. Каждое изменение применяется
// мгновенно: `onChange` коммитит атом сразу, а запись в хранилище дебаунсится
// (флаш на blur поля и на размонтирование — данные не теряются).
export const MyPlaylistsAppearanceForm = ({
  onChange,
  settings,
}: {
  onChange: (patch: Partial<LocalSectionSettings>) => void
  settings: LocalSectionSettings
}) => {
  const [itemsRowsText, setItemsRowsText] = useState(() => toItemsRowsText(settings.itemsRows))
  const [syncedItemsRows, setSyncedItemsRows] = useState(settings.itemsRows)
  const schedulePersist = useScheduleSectionSettingsPersist()

  // Внешнее изменение `itemsRows` (второй писатель) подхватывается по
  // React-паттерну «adjust state during render»: сравнение с прошлым значением
  // идёт в рендере, без эффекта. Уже набранный текст, совпадающий по значению,
  // не перетирается — иначе каретка прыгала бы на каждое нажатие от собственного
  // коммита формы.
  if (syncedItemsRows !== settings.itemsRows) {
    setSyncedItemsRows(settings.itemsRows)
    setItemsRowsText(current =>
      parseItemsRows(current) === settings.itemsRows
        ? current
        : toItemsRowsText(settings.itemsRows),
    )
  }

  const applyChange = (patch: Partial<LocalSectionSettings>) => {
    onChange(patch)
    schedulePersist()
  }

  const handleItemsRowsChange = (text: string) => {
    setItemsRowsText(text)
    applyChange({ itemsRows: parseItemsRows(text) })
  }

  return (
    <>
      <SelectField
        label={ITEMS_SIZE_LABEL}
        value={settings.itemsSize}
        options={ITEMS_SIZE_OPTIONS}
        onChange={value => applyChange({ itemsSize: value })}
      />
      <SelectField
        label={TRANSFORM_LABEL}
        value={settings.transform}
        options={TRANSFORM_OPTIONS}
        onChange={value => applyChange({ transform: value })}
      />
      <SelectField
        label={SLIDE_TITLE_LOCATION_LABEL}
        options={SLIDE_TITLE_LOCATION_OPTIONS}
        value={settings.whereIsSlideTitleLocated}
        onChange={value => applyChange({ whereIsSlideTitleLocated: value })}
      />
      <FormField
        value={itemsRowsText}
        hint={ITEMS_ROWS_HINT}
        label={ITEMS_ROWS_LABEL}
        keyboardType='number-pad'
        onBlur={schedulePersist.flush}
        placeholder={ITEMS_ROWS_PLACEHOLDER}
        onChangeText={handleItemsRowsChange}
      />
      <CheckboxField
        label={LARGE_DESCRIPTION_TITLE_LABEL}
        value={settings.isDescriptionTitleOnSlideLarge}
        onChange={value => applyChange({ isDescriptionTitleOnSlideLarge: value })}
      />
      <CheckboxField
        label={BORDER_RADIUS_LABEL}
        value={settings.borderRadius}
        onChange={value => applyChange({ borderRadius: value })}
      />
    </>
  )
}
