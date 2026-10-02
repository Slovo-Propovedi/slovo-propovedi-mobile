import { CheckboxField, FormField, SelectField } from 'shared/ui/form'
import {
  ITEMS_SIZE_OPTIONS,
  SLIDE_TITLE_LOCATION_OPTIONS,
  TRANSFORM_OPTIONS,
} from '../lib/sectionFormOptions'
import { type SectionFormValues } from '../lib/sectionFormState'

// Блок «Оформление» формы раздела: размеры, расположение заголовка, строки, чекбоксы.
export const SectionFormAppearanceFields = ({
  onChange,
  values,
}: {
  onChange: <K extends keyof SectionFormValues>(key: K, value: SectionFormValues[K]) => void
  values: SectionFormValues
}) => (
  <>
    <SelectField
      label='Размер карточек'
      value={values.itemsSize}
      options={ITEMS_SIZE_OPTIONS}
      onChange={value => onChange('itemsSize', value)}
    />
    <SelectField
      label='Высота карточек'
      value={values.transform}
      options={TRANSFORM_OPTIONS}
      onChange={value => onChange('transform', value)}
    />
    <SelectField
      label='Расположение заголовка'
      options={SLIDE_TITLE_LOCATION_OPTIONS}
      value={values.whereIsSlideTitleLocated}
      onChange={value => onChange('whereIsSlideTitleLocated', value)}
    />
    <FormField
      label='Строк'
      hint='Необязательно.'
      value={values.itemsRows}
      keyboardType='number-pad'
      placeholder='Например: 2'
      onChangeText={text => onChange('itemsRows', text)}
    />
    <CheckboxField
      label='Описание на карточке'
      value={values.isDescriptionTitleOnSlideLarge}
      onChange={value => onChange('isDescriptionTitleOnSlideLarge', value)}
    />
    <CheckboxField
      value={values.borderRadius}
      label='Скруглённые углы карточек'
      onChange={value => onChange('borderRadius', value)}
    />
  </>
)
