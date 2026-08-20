import { useAtom } from '@reatom/npm-react'
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native'
import { FONT_SIZES, INDENTS, RADIUSES, useTheme } from 'shared/ui/theme'
import { SEARCH_HEADER_HEIGHT } from '../lib/constants'
import { getSuggestions, type Suggestion } from '../lib/suggestions'
import { distinctValuesAtom } from '../model-distinctValues'

const MAX_SUGGESTIONS = 8
const ARTIST_LABEL = 'проповедник'
const BOOK_LABEL = 'книга'
// The bar is centered in the header with an INDENTS.low offset on each side,
// so the dropdown starts right below the header when offset by the same amount.
const SUGGESTIONS_TOP = SEARCH_HEADER_HEIGHT - INDENTS.low

interface SearchSuggestionsProps {
  isFocused: boolean
  onSelect: (value: string) => void
  query: string
}

interface SuggestionRowProps {
  onPress: () => void
  suggestion: Suggestion
}

export const SearchSuggestions = ({ isFocused, onSelect, query }: SearchSuggestionsProps) => {
  const { currentTheme } = useTheme()
  const [distinctValues] = useAtom(distinctValuesAtom)

  if (!distinctValues || !isFocused) return null

  const suggestions = getSuggestions(
    distinctValues.artists,
    distinctValues.books,
    query,
    MAX_SUGGESTIONS,
  )
  if (suggestions.length === 0) return null

  return (
    <ScrollView
      keyboardShouldPersistTaps='handled'
      style={[styles.dropdown, { backgroundColor: currentTheme.surface }]}
    >
      {suggestions.map(suggestion => (
        <SuggestionRow
          suggestion={suggestion}
          onPress={() => onSelect(suggestion.value)}
          key={`${suggestion.category}:${suggestion.value}`}
        />
      ))}
    </ScrollView>
  )
}

const SuggestionRow = ({ onPress, suggestion }: SuggestionRowProps) => {
  const { currentTheme } = useTheme()
  const categoryLabel = suggestion.category === 'artist' ? ARTIST_LABEL : BOOK_LABEL

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole='button'
      accessibilityLabel={`${suggestion.value}, ${categoryLabel}`}
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: pressed ? currentTheme.card : 'transparent' },
      ]}
    >
      <Text numberOfLines={1} style={[styles.value, { color: currentTheme.text }]}>
        {suggestion.value}
      </Text>
      <Text style={[styles.category, { color: currentTheme.textMuted }]}>{categoryLabel}</Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  category: {
    fontSize: FONT_SIZES.sm,
    marginLeft: INDENTS.middle,
  },
  dropdown: {
    borderRadius: RADIUSES.middle,
    elevation: 8,
    left: 0,
    maxHeight: 240,
    position: 'absolute',
    right: 0,
    shadowColor: '#000',
    shadowOffset: { height: 4, width: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    top: SUGGESTIONS_TOP,
    zIndex: 1,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    paddingHorizontal: INDENTS.medium,
    paddingVertical: INDENTS.middle,
  },
  value: {
    flex: 1,
    fontSize: FONT_SIZES.md,
  },
})
