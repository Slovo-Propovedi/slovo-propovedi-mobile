import { useAtom } from '@reatom/npm-react'
import { Platform, TextInput, View } from 'react-native'
import { useEscapeKey } from 'shared/lib/escape-key'
import { INPUT_LIMITS } from 'shared/lib/validation/inputLimits'
import { useTheme } from 'shared/ui/theme'
import { useSearchBarModel } from '../lib/useSearchBarModel'
import { isSearchOpenAtom } from '../model'
import { isSearchFieldVisibleAtom } from '../model-searchField'
import { styles } from './SearchBar.styles'
import { SearchBarClearButton } from './SearchBarClearButton'
import { SearchBarMicButton } from './SearchBarMicButton'
import { SearchSuggestions } from './SearchSuggestions'

const SEARCH_PLACEHOLDER = 'Проповеди, проповедники, название книги'

// The magnifier lives in the morphing search frame as its always-mounted first
// child; this component is only the field's content row. The page-hosted field
// passes its own session/visibility flags and opens suggestions downward; the
// bottom pill keeps the atom-derived flags and the upward dropdown.
export const SearchBar = ({
  isOpen,
  isVisible,
  onFocusChange,
  suggestionsPlacement = 'above',
}: {
  isOpen?: boolean
  isVisible?: boolean
  onFocusChange?: (isFocused: boolean) => void
  suggestionsPlacement?: 'above' | 'below'
}) => {
  const { currentTheme } = useTheme()
  const [isOpenAtom] = useAtom(isSearchOpenAtom)
  const [isVisibleAtom] = useAtom(isSearchFieldVisibleAtom)
  const {
    handleChangeText,
    handleClear,
    handleClearQuery,
    handleFocusChange,
    handleSelectSuggestion,
    hasSelectedSuggestion,
    inputRef,
    inputValue,
    isFocused,
    isSearchOpen,
    voiceInput,
  } = useSearchBarModel(isOpen ?? isOpenAtom, isVisible ?? isVisibleAtom, onFocusChange)

  // Esc goes through the shared escape stack: its capture listener on document
  // sees the event before the focused input, so one path covers focus and blur.
  useEscapeKey({
    enabled: Platform.OS === 'web' && isSearchOpen,
    onEscape: handleClear,
  })

  const isQueryEmpty = inputValue.length === 0

  return (
    <View style={styles.container} pointerEvents='box-none'>
      <TextInput
        ref={inputRef}
        value={inputValue}
        autoCorrect={false}
        autoCapitalize='none'
        returnKeyType='search'
        maxLength={INPUT_LIMITS.search}
        onChangeText={handleChangeText}
        placeholder={SEARCH_PLACEHOLDER}
        onBlur={() => handleFocusChange(false)}
        onFocus={() => handleFocusChange(true)}
        accessibilityLabel={SEARCH_PLACEHOLDER}
        placeholderTextColor={currentTheme.textMuted}
        style={[
          styles.input,
          Platform.OS === 'web' && styles.webInputOutline,
          { color: currentTheme.text },
        ]}
      />
      {isQueryEmpty && (
        <SearchBarMicButton
          onPress={voiceInput.startListening}
          isListening={voiceInput.isListening}
          isUnavailable={voiceInput.isUnavailable}
        />
      )}
      {!isQueryEmpty && <SearchBarClearButton onPress={handleClearQuery} />}
      {!hasSelectedSuggestion && (
        <SearchSuggestions
          query={inputValue}
          isFocused={isFocused}
          onSelect={handleSelectSuggestion}
          isBelow={suggestionsPlacement === 'below'}
        />
      )}
    </View>
  )
}
