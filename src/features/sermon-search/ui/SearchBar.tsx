import { useAction, useAtom, useCtx } from '@reatom/npm-react'
import { useEffect, useState } from 'react'
import {
  Keyboard,
  Platform,
  Text,
  TextInput,
  type TextInputKeyPressEvent,
  View,
} from 'react-native'
import { isEscapeKey, useEscapeKey } from 'shared/lib/escape-key'
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

  const handleKeyPress = (event: TextInputKeyPressEvent) => {
    if (Platform.OS !== 'web') return
    if (!isEscapeKey(event)) return
    handleClear()
  }

  // RNW's TextInput stops propagation of its own keydown before the user's
  // onKeyPress runs, so a focused input only ever reaches the input-scoped
  // path above. When the input is NOT focused the event bubbles to document,
  // where this listener (gated on search-open) handles it — the two paths are
  // mutually exclusive by construction.
  useEscapeKey({
    enabled: Platform.OS === 'web' && isSearchOpen,
    onEscape: handleClear,
    scope: 'document',
  })

  return (
    <View style={[styles.container, { backgroundColor: currentTheme.surface }]}>
      <TextInput
        ref={inputRef}
        value={inputValue}
        autoCorrect={false}
        autoCapitalize='none'
        returnKeyType='search'
        onKeyPress={handleKeyPress}
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
