import { useAction, useAtom, useCtx } from '@reatom/npm-react'
import { useEffect, useState } from 'react'
import { Keyboard, Platform, Text, TextInput, View } from 'react-native'
import { useEscapeKey } from 'shared/lib/escape-key'
import { IconButton } from 'shared/ui/icon-button'
import { INDENTS, useTheme } from 'shared/ui/theme'
import { useSearchAutofocus } from '../lib/useSearchAutofocus'
import { closeSearch, isSearchOpenAtom, resetSearchResults, searchQueryAtom } from '../model'
import { fetchDistinctValues } from '../model-distinctValues'
import { styles } from './SearchBar.styles'
import { SearchSuggestions } from './SearchSuggestions'

const SEARCH_PLACEHOLDER = 'Поиск проповедей'
const CLEAR_LABEL = 'Очистить поиск'
const CLEAR_SYMBOL = '✕'

export const SearchBar = () => {
  const { currentTheme } = useTheme()
  const ctx = useCtx()
  const [, setQuery] = useAtom(searchQueryAtom)
  const [isSearchOpen] = useAtom(isSearchOpenAtom)
  // Local state drives the input so async re-renders (spinner flips, results
  // landing) can never push a stale query back. Seeded from the atom at mount.
  const [inputValue, setInputValue] = useState(() => ctx.get(searchQueryAtom))
  const [isFocused, setIsFocused] = useState(false)
  const [hasSelectedSuggestion, setHasSelectedSuggestion] = useState(false)
  const inputRef = useSearchAutofocus()
  const closeSearchAction = useAction(closeSearch)
  const resetSearchResultsAction = useAction(resetSearchResults)
  const fetchDistinctValuesAction = useAction(fetchDistinctValues)

  useEffect(() => void fetchDistinctValuesAction(), [fetchDistinctValuesAction])

  const handleChangeText = (text: string) => {
    setInputValue(text)
    setQuery(text)
    setHasSelectedSuggestion(false)
  }

  const handleSelectSuggestion = (value: string) => {
    setInputValue(value)
    setQuery(value)
    setHasSelectedSuggestion(true)
  }

  const handleClear = () => {
    if (inputValue.length > 0) {
      setInputValue('')
      void resetSearchResultsAction()
      setQuery('')
      return
    }

    inputRef.current?.blur()
    Keyboard.dismiss()
    void closeSearchAction()
  }

  // Esc goes through the shared escape stack: its capture listener on document
  // sees the event before the focused input, so one path covers focus and blur.
  useEscapeKey({
    enabled: Platform.OS === 'web' && isSearchOpen,
    onEscape: handleClear,
  })

  return (
    <View style={[styles.container, { backgroundColor: currentTheme.surface }]}>
      <TextInput
        ref={inputRef}
        value={inputValue}
        autoCorrect={false}
        autoCapitalize='none'
        returnKeyType='search'
        onChangeText={handleChangeText}
        placeholder={SEARCH_PLACEHOLDER}
        onBlur={() => setIsFocused(false)}
        onFocus={() => setIsFocused(true)}
        accessibilityLabel={SEARCH_PLACEHOLDER}
        placeholderTextColor={currentTheme.textMuted}
        style={[
          styles.input,
          {
            borderColor: isFocused ? currentTheme.primary : 'transparent',
            color: currentTheme.text,
          },
        ]}
      />
      <IconButton
        hitSlop={INDENTS.low}
        onPress={handleClear}
        style={styles.clearButton}
        accessibilityLabel={CLEAR_LABEL}
        Icon={
          <Text style={[styles.clearIcon, { color: currentTheme.textMuted }]}>{CLEAR_SYMBOL}</Text>
        }
      />
      {!hasSelectedSuggestion && (
        <SearchSuggestions
          query={inputValue}
          isFocused={isFocused}
          onSelect={handleSelectSuggestion}
        />
      )}
    </View>
  )
}
