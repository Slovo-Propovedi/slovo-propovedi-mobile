import Ionicons from '@expo/vector-icons/Ionicons'
import { useState } from 'react'
import { Text, View } from 'react-native'
import { Modal } from 'shared/ui/modal'
import { useTheme } from 'shared/ui/theme'
import { TouchableItem } from 'shared/ui/touchable-item'
import { SelectOptionRow } from './SelectOptionRow'
import { styles } from './styles'

export interface SelectOption<T extends string> {
  label: string
  value: T
}

// Поле выбора из списка: открывает модалку с вариантами (радио-стиль).
export const SelectField = <T extends string>({
  label,
  onChange,
  options,
  value,
}: {
  label: string
  onChange: (value: T) => void
  options: SelectOption<T>[]
  value: T
}) => {
  const { currentTheme } = useTheme()
  const [isOpen, setIsOpen] = useState(false)
  const selectedLabel = options.find(option => option.value === value)?.label ?? value

  const handleSelect = (nextValue: T) => {
    onChange(nextValue)
    setIsOpen(false)
  }

  return (
    <View style={styles.field}>
      <Text style={[styles.fieldLabel, { color: currentTheme.text }]}>{label}</Text>
      <TouchableItem
        onPress={() => setIsOpen(true)}
        style={[styles.selectTrigger, { borderColor: currentTheme.textMuted }]}
      >
        <Text style={[styles.selectTriggerText, { color: currentTheme.text }]}>
          {selectedLabel}
        </Text>
        <Ionicons size={18} name='chevron-down' color={currentTheme.textMuted} />
      </TouchableItem>
      <Modal visible={isOpen} onBackdropPress={() => setIsOpen(false)}>
        <View style={styles.selectModal}>
          {options.map(option => (
            <SelectOptionRow
              key={option.value}
              label={option.label}
              isSelected={option.value === value}
              onPress={() => handleSelect(option.value)}
            />
          ))}
        </View>
      </Modal>
    </View>
  )
}
