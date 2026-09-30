import Ionicons from '@expo/vector-icons/Ionicons'
import { useState } from 'react'
import { Text, View } from 'react-native'
import { Modal } from '../modal'
import { useTheme } from '../theme/ThemeContext/useTheme'
import { TouchableItem } from '../touchable-item'
import { formStyles } from './formStyles'
import { RequiredAsterisk } from './RequiredAsterisk'
import { SelectOptionRow } from './SelectOptionRow'

export interface SelectOption<T extends string> {
  label: string
  value: T
}

// Поле выбора из списка: открывает модалку с вариантами (радио-стиль).
export const SelectField = <T extends string>({
  label,
  onChange,
  options,
  required = false,
  value,
}: {
  label: string
  onChange: (value: T) => void
  options: SelectOption<T>[]
  required?: boolean
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
    <View style={formStyles.field}>
      <Text style={[formStyles.fieldLabel, { color: currentTheme.text }]}>
        {label}
        {required ? <RequiredAsterisk /> : null}
      </Text>
      <TouchableItem
        onPress={() => setIsOpen(true)}
        style={[formStyles.selectTrigger, { borderColor: currentTheme.textMuted }]}
      >
        <Text style={[formStyles.selectTriggerText, { color: currentTheme.text }]}>
          {selectedLabel}
        </Text>
        <Ionicons size={18} name='chevron-down' color={currentTheme.textMuted} />
      </TouchableItem>
      <Modal visible={isOpen} onBackdropPress={() => setIsOpen(false)}>
        <View style={formStyles.selectModal}>
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
