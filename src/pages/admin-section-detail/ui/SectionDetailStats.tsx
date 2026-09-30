import { View } from 'react-native'
import { ITEMS_SIZE_LABELS, SLIDE_TITLE_LOCATION_LABELS, TRANSFORM_LABELS } from 'entities/section'
import { type APITypes } from 'shared/api'
import { SectionDetailStat } from './SectionDetailStat'
import { styles } from './styles'

const YES = 'Да'
const NO = 'Нет'

// Сетка статистики раздела: оформление и параметры слайдера.
export const SectionDetailStats = ({ section }: { section: APITypes.SectionEntity }) => {
  const stats = [
    { label: 'Размер карточек', value: ITEMS_SIZE_LABELS[section.itemsSize] },
    { label: 'Высота', value: TRANSFORM_LABELS[section.transform] },
    {
      label: 'Заголовок',
      value: SLIDE_TITLE_LOCATION_LABELS[section.whereIsSlideTitleLocated ?? 'on'],
    },
    { label: 'Строк', value: section.itemsRows == null ? '—' : String(section.itemsRows) },
    { label: 'Крупный заголовок', value: section.isDescriptionTitleOnSlideLarge ? YES : NO },
    { label: 'Скруглённые углы', value: section.borderRadius ? YES : NO },
  ]

  return (
    <View style={styles.stats}>
      {stats.map(stat => (
        <SectionDetailStat key={stat.label} label={stat.label} value={stat.value} />
      ))}
    </View>
  )
}
