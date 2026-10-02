import { type LocalSectionSettings } from 'entities/playlist'
import { ITEMS_SIZE_LABELS, SLIDE_TITLE_LOCATION_LABELS, TRANSFORM_LABELS } from 'entities/section'
import { type SelectOption } from 'shared/ui/form'

export const ITEMS_SIZE_OPTIONS: SelectOption<LocalSectionSettings['itemsSize']>[] = [
  { label: ITEMS_SIZE_LABELS.small, value: 'small' },
  { label: ITEMS_SIZE_LABELS.middle, value: 'middle' },
  { label: ITEMS_SIZE_LABELS.large, value: 'large' },
  { label: ITEMS_SIZE_LABELS.xLarge, value: 'xLarge' },
]

export const TRANSFORM_OPTIONS: SelectOption<LocalSectionSettings['transform']>[] = [
  { label: TRANSFORM_LABELS.high, value: 'high' },
  { label: TRANSFORM_LABELS.middle, value: 'middle' },
  { label: TRANSFORM_LABELS.short, value: 'short' },
]

export const SLIDE_TITLE_LOCATION_OPTIONS: SelectOption<
  LocalSectionSettings['whereIsSlideTitleLocated']
>[] = [
  { label: SLIDE_TITLE_LOCATION_LABELS.on, value: 'on' },
  { label: SLIDE_TITLE_LOCATION_LABELS.under, value: 'under' },
]
