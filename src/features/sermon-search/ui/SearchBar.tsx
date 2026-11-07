import { Ionicons } from '@expo/vector-icons'
import { useAction, useAtom, useCtx } from '@reatom/npm-react'
import { useEffect, useRef, useState } from 'react'
import { Keyboard, Platform, TextInput, View } from 'react-native'
import { useEscapeKey } from 'shared/lib/escape-key'
import { INPUT_LIMITS } from 'shared/lib/validation/inputLimits'
import { useTheme } from 'shared/ui/theme'
import { useSearchAutofocus } from '../lib/useSearchAutofocus'
import {
  closeSearch,
  isSearchOpenAtom,
  resetSearchResults,
  searchInputRequestAtom,
  searchQueryAtom,
} from '../model'
import { fetchDistinctValues } from '../model-distinctValues'
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
  // Nonce of the last external request already mirrored, seeded from the current
  // one so a stale request is not replayed when the bar mounts.
  const handledRequestNonceRef = useRef(inputRequest?.nonce ?? 0)
  const inputRef = useSearchAutofocus()
  const closeSearchAction = useAction(closeSearch)
  const resetSearchResultsAction = useAction(resetSearchResults)
  const fetchDistinctValuesAction = useAction(fetchDistinctValues)

  useEffect(() => void fetchDistinctValuesAction(), [fetchDistinctValuesAction])

  // Mirror an external typing request (onboarding tour) into the visible input —
  // the same path a manual keystroke takes; the action already set the query atom.
  useEffect(() => {
    if (inputRequest === null || inputRequest.nonce === handledRequestNonceRef.current) return

    handledRequestNonceRef.current = inputRequest.nonce
    // eslint-disable-next-line react-hooks-extra/no-direct-set-state-in-use-effect -- external typing signal must land in the visible input
    setInputValue(inputRequest.text)
    // eslint-disable-next-line react-hooks-extra/no-direct-set-state-in-use-effect -- a fresh query hides the suggestion list
    setHasSelectedSuggestion(false)
  }, [inputRequest])

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
