import { Text, View } from 'react-native'
import { FormField } from 'shared/ui/form'
import { useTheme } from 'shared/ui/theme'
import { TouchableItem } from 'shared/ui/touchable-item'
import { filterSuggestions } from '../lib/useSermonSuggestions'
import { styles } from './styles'

// Текстовое поле с подсказками из ранее использованных значений: печатаешь —
// ниже появляются тапабельные варианты, начинающиеся с введённого текста.
export const SuggestionField = ({
  hint,
  label,
  onChangeText,
  options,
  placeholder,
  value,
}: {
  hint?: string
  label: string
  onChangeText: (text: string) => void
  options: string[]
  placeholder?: string
  value: string
}) => {
  const { currentTheme } = useTheme()
  const suggestions = filterSuggestions(options, value)

  return (
    <View>
      <FormField
        hint={hint}
        label={label}
        value={value}
        placeholder={placeholder}
        onChangeText={onChangeText}
      />
      {suggestions.length > 0 ? (
        <View style={styles.suggestionsRow}>
          {suggestions.map(suggestion => (
            <TouchableItem
              key={suggestion}
              onPress={() => onChangeText(suggestion)}
              style={[styles.suggestion, { backgroundColor: currentTheme.surface }]}
            >
              <Text style={[styles.suggestionText, { color: currentTheme.text }]}>
                {suggestion}
              </Text>
            </TouchableItem>
          ))}
        </View>
      ) : null}
    </View>
  )
}
