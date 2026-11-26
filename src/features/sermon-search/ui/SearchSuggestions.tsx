import { useAtom } from '@reatom/npm-react'
import { ScrollView, StyleSheet, Text } from 'react-native'
import { TAB_BAR_ISLAND_HEIGHT_EXPANDED } from 'shared/ui/layout'
import { PressableButton } from 'shared/ui/pressable-button'
import { FONT_SIZES, INDENTS, RADIUSES, useTheme } from 'shared/ui/theme'
import { getSuggestions, type Suggestion } from '../lib/suggestions'
import { distinctValuesAtom } from '../model-distinctValues'

const MAX_SUGGESTIONS = 8
const ARTIST_LABEL = 'проповедник'
const BOOK_LABEL = 'книга'

export const SearchSuggestions = ({
  isBelow = false,
  isFocused,
  onSelect,
  query,
}: {
  /** Open downward under the page field instead of upward above the bottom pill. */
  isBelow?: boolean
  isFocused: boolean
  onSelect: (value: string) => void
  query: string
}) => {
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
      style={[
        styles.dropdown,
        isBelow ? styles.dropdownBelow : styles.dropdownAbove,
        { backgroundColor: currentTheme.surface },
      ]}
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

const SuggestionRow = ({
  onPress,
  suggestion,
}: {
  onPress: () => void
  suggestion: Suggestion
}) => {
  const { currentTheme } = useTheme()
  const categoryLabel = suggestion.category === 'artist' ? ARTIST_LABEL : BOOK_LABEL

  return (
    <PressableButton
      onPress={onPress}
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
    </PressableButton>
  )
}

const styles = StyleSheet.create({
  category: {
    fontSize: FONT_SIZES.sm,
    marginLeft: INDENTS.middle,
  },
  dropdown: {
    borderRadius: RADIUSES.middle,
    boxShadow: '0px 4px 8px rgba(0,0,0,0.3)',
    elevation: 8,
    left: 0,
    maxHeight: 240,
    position: 'absolute',
    right: 0,
    zIndex: 1,
  },
  // The bottom pill hosts the field, so there the dropdown opens UPWARD: its
  // bottom edge sits one gap above the pill's top edge. The open field is always
  // the expanded bar height, so the dropdown clears it in every bar state.
  dropdownAbove: {
    bottom: TAB_BAR_ISLAND_HEIGHT_EXPANDED + INDENTS.low,
  },
  // The page field sits at the top of the screen, so there the dropdown opens
  // DOWNWARD from the field's bottom edge instead of covering the title above it.
  dropdownBelow: {
    marginTop: INDENTS.low,
    top: '100%',
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
