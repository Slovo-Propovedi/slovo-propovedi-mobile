import Ionicons from '@expo/vector-icons/Ionicons'
import { useState } from 'react'
import { Text, View } from 'react-native'
import { Modal } from '../modal'
import { useTheme } from '../theme/ThemeContext/useTheme'
import { TouchableItem } from '../touchable-item'
import { styles } from './styles'

export interface AdminSelectOption<T extends string> {
  label: string
  value: T
}

// Компактный селект для шапок админских списков: открывает модалку с
// вариантами и показывает выбранную метку на триггере. Как SelectField в
// формах, но без подписи-лейбла и на всю ширину строки контролов.
export const AdminSelect = <T extends string>({
  onChange,
  options,
  value,
}: {
  onChange: (value: T) => void
  options: AdminSelectOption<T>[]
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
    <View style={styles.wrapper}>
      <TouchableItem
        onPress={() => setIsOpen(true)}
        style={[
          styles.trigger,
          { backgroundColor: currentTheme.surface, borderColor: currentTheme.textMuted },
        ]}
      >
        <Text style={[styles.triggerText, { color: currentTheme.text }]}>{selectedLabel}</Text>
        <Ionicons size={18} name='chevron-down' color={currentTheme.textMuted} />
      </TouchableItem>
      <Modal visible={isOpen} onBackdropPress={() => setIsOpen(false)}>
        <View style={styles.modal}>
          {options.map(option => {
            const isSelected = option.value === value

            return (
              <TouchableItem
                key={option.value}
                onPress={() => handleSelect(option.value)}
                accessibilityState={{ selected: isSelected }}
                style={[
                  styles.option,
                  { borderColor: isSelected ? currentTheme.primary : 'transparent' },
                ]}
              >
                <Text style={[styles.optionLabel, { color: currentTheme.text }]}>
                  {option.label}
                </Text>
                {isSelected ? (
                  <Ionicons size={20} name='checkmark' color={currentTheme.primary} />
                ) : (
                  <View style={styles.optionSpacer} />
                )}
              </TouchableItem>
            )
          })}
        </View>
      </Modal>
    </View>
  )
}
