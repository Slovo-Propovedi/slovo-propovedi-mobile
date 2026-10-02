import { useState } from 'react'
import { Text, View } from 'react-native'
import { useDebounce } from 'shared/lib/hooks/useDebounce'
import { FormField } from 'shared/ui/form'
import { useTheme } from 'shared/ui/theme'
import { TouchableItem } from 'shared/ui/touchable-item'
import { filterSuggestions } from '../lib/useSermonSuggestions'
import { styles } from './styles'

// Сколько подсказок показывать при фокусе на пустом поле: список ранее
// использованных значений может быть длинным, поэтому обрезаем его.
const SUGGESTION_LIMIT = 10

// Пауза перед скрытием подсказок после блюра: тап по чипсу успевает сработать
// раньше, чем поле потеряет фокус и ряд подсказок размонтируется.
const BLUR_HIDE_DELAY_MS = 150

// Текстовое поле с подсказками из ранее использованных значений: при фокусе
// показываются ранее использованные варианты (на пустом поле — первые
// SUGGESTION_LIMIT), при вводе — только совпадающие, при блюре — скрываются.
export const SuggestionField = ({
  hint,
  invalid = false,
  label,
  onBlur,
  onChangeText,
  options,
  placeholder,
  required = false,
  value,
}: {
  hint?: string
  invalid?: boolean
  label: string
  onBlur?: () => void
  onChangeText: (text: string) => void
  options: string[]
  placeholder?: string
  required?: boolean
  value: string
}) => {
  const { currentTheme } = useTheme()
  const [isFocused, setIsFocused] = useState(false)
  const hideSuggestions = useDebounce(() => setIsFocused(false), BLUR_HIDE_DELAY_MS)

  const handleFocus = () => {
    hideSuggestions.clear()
    setIsFocused(true)
  }

  const handleBlur = () => {
    hideSuggestions()
    onBlur?.()
  }

  const handleSuggestionPress = (suggestion: string) => {
    hideSuggestions.clear()
    onChangeText(suggestion)
  }

  const suggestions = isFocused
    ? value.trim() === ''
      ? options.slice(0, SUGGESTION_LIMIT)
      : filterSuggestions(options, value)
    : []

  return (
    <View>
      <FormField
        hint={hint}
        label={label}
        value={value}
        invalid={invalid}
        onBlur={handleBlur}
        required={required}
        onFocus={handleFocus}
        placeholder={placeholder}
        onChangeText={onChangeText}
      />
      {suggestions.length > 0 ? (
        <View style={styles.suggestionsRow}>
          {suggestions.map(suggestion => (
            <TouchableItem
              key={suggestion}
              onPress={() => handleSuggestionPress(suggestion)}
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
