import { ActivityIndicator, Text, View } from 'react-native'
import { COLORS, useTheme } from 'shared/ui/theme'
import { orderSelectedFirst } from '../lib/orderSelectedFirst'
import { useSectionOptions } from '../lib/useSectionOptions'
import { pickerStyles } from './pickerStyles'
import { SectionPickerRow } from './SectionPickerRow'
import { styles } from './styles'

const LOAD_ERROR = 'Не удалось загрузить разделы'

// Список разделов с чекбоксами; выбранные строки идут первыми. `selectedIds` —
// источник истины, сохраняется между рендерами.
export const SectionPicker = ({
  onToggle,
  selectedIds,
}: {
  onToggle: (id: string) => void
  selectedIds: string[]
}) => {
  const { currentTheme } = useTheme()
  const { isError, isLoading, sections } = useSectionOptions()
  const orderedSections = orderSelectedFirst(sections, selectedIds, section => section.id)

  if (isLoading)
    return (
      <View style={pickerStyles.state}>
        <ActivityIndicator color={COLORS.primary} />
      </View>
    )

  if (isError)
    return <Text style={[styles.hint, { color: currentTheme.textMuted }]}>{LOAD_ERROR}</Text>

  return (
    <View>
      <Text style={[styles.hint, { color: currentTheme.textMuted }]}>
        {`Выбрано: ${selectedIds.length}`}
      </Text>
      <View style={pickerStyles.list}>
        {orderedSections.map(section => (
          <SectionPickerRow
            key={section.id}
            title={section.title}
            onToggle={() => onToggle(section.id)}
            isSelected={selectedIds.includes(section.id)}
          />
        ))}
      </View>
    </View>
  )
}
