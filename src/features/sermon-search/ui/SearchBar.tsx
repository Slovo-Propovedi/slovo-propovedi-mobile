import { Ionicons } from '@expo/vector-icons'
import { useAction, useAtom, useCtx } from '@reatom/npm-react'
import { useState } from 'react'
import { Keyboard, Platform, TextInput, View } from 'react-native'
import { useEscapeKey } from 'shared/lib/escape-key'
import { INPUT_LIMITS } from 'shared/lib/validation/inputLimits'
import { useTheme } from 'shared/ui/theme'
import { useDistinctValuesOnOpen } from '../lib/useDistinctValuesOnOpen'
import { useExternalInputRequest } from '../lib/useExternalInputRequest'
import { useResetInputOnClose } from '../lib/useResetInputOnClose'
import { useSearchAutofocus } from '../lib/useSearchAutofocus'
import {
  closeSearch,
  isSearchOpenAtom,
  resetSearchResults,
  searchInputRequestAtom,
  searchQueryAtom,
} from '../model'
import { styles } from './SearchBar.styles'
import { SearchBarClearButton } from './SearchBarClearButton'
import { SearchSuggestions } from './SearchSuggestions'

const SEARCH_PLACEHOLDER = 'Поиск проповедей'
const SEARCH_ICON_SIZE = 20

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
  const [inputRequest] = useAtom(searchInputRequestAtom)
  const inputRef = useSearchAutofocus(isSearchOpen)
  const closeSearchAction = useAction(closeSearch)
  const resetSearchResultsAction = useAction(resetSearchResults)
  useDistinctValuesOnOpen(isSearchOpen)

  // Closing clears the local field too: a reopen must start with an empty input
  // even though the bar stays mounted for the island's exit animation.
  useResetInputOnClose(isSearchOpen, () => {
    setInputValue('')
    setHasSelectedSuggestion(false)
  })

  useExternalInputRequest({
    inputRequest,
    onApply: text => {
      setInputValue(text)
      setHasSelectedSuggestion(false)
    },
  })

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
    <View style={styles.container}>
      <Ionicons
        name='search'
        size={SEARCH_ICON_SIZE}
        style={styles.searchIcon}
        color={currentTheme.textMuted}
      />
      <TextInput
        ref={inputRef}
        value={inputValue}
        autoCorrect={false}
        autoCapitalize='none'
        returnKeyType='search'
        maxLength={INPUT_LIMITS.search}
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
      <SearchBarClearButton onPress={handleClear} />
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
