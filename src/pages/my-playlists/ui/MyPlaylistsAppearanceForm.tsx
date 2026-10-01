import { useState } from 'react'
import { type LocalSectionSettings } from 'entities/playlist'
import { parseItemsRows } from 'shared/lib/utils/parseItemsRows'
import { CheckboxField, FormField, SelectField } from 'shared/ui/form'
import {
  ITEMS_SIZE_OPTIONS,
  SLIDE_TITLE_LOCATION_OPTIONS,
  TRANSFORM_OPTIONS,
} from '../lib/myPlaylistsSectionOptions'

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
// мгновенно (`onChange` пишет в атом и хранилище).
export const MyPlaylistsAppearanceForm = ({
  onChange,
  settings,
}: {
  onChange: (patch: Partial<LocalSectionSettings>) => void
  settings: LocalSectionSettings
}) => {
  const [itemsRowsText, setItemsRowsText] = useState(() => toItemsRowsText(settings.itemsRows))

  const handleItemsRowsChange = (text: string) => {
    setItemsRowsText(text)
    onChange({ itemsRows: parseItemsRows(text) })
  }

  return (
    <>
      <SelectField
        label={ITEMS_SIZE_LABEL}
        value={settings.itemsSize}
        options={ITEMS_SIZE_OPTIONS}
        onChange={value => onChange({ itemsSize: value })}
      />
      <SelectField
        label={TRANSFORM_LABEL}
        value={settings.transform}
        options={TRANSFORM_OPTIONS}
        onChange={value => onChange({ transform: value })}
      />
      <SelectField
        label={SLIDE_TITLE_LOCATION_LABEL}
        options={SLIDE_TITLE_LOCATION_OPTIONS}
        value={settings.whereIsSlideTitleLocated}
        onChange={value => onChange({ whereIsSlideTitleLocated: value })}
      />
      <FormField
        value={itemsRowsText}
        hint={ITEMS_ROWS_HINT}
        label={ITEMS_ROWS_LABEL}
        keyboardType='number-pad'
        placeholder={ITEMS_ROWS_PLACEHOLDER}
        onChangeText={handleItemsRowsChange}
      />
      <CheckboxField
        label={LARGE_DESCRIPTION_TITLE_LABEL}
        value={settings.isDescriptionTitleOnSlideLarge}
        onChange={value => onChange({ isDescriptionTitleOnSlideLarge: value })}
      />
      <CheckboxField
        label={BORDER_RADIUS_LABEL}
        value={settings.borderRadius}
        onChange={value => onChange({ borderRadius: value })}
      />
    </>
  )
}
