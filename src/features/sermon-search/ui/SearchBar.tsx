import { Ionicons } from '@expo/vector-icons'
import { Platform, TextInput, View } from 'react-native'
import { useEscapeKey } from 'shared/lib/escape-key'
import { INPUT_LIMITS } from 'shared/lib/validation/inputLimits'
import { useTheme } from 'shared/ui/theme'
import { useSearchBarModel } from '../lib/useSearchBarModel'
import { styles } from './SearchBar.styles'
import { SearchBarClearButton } from './SearchBarClearButton'
import { SearchBarMicButton } from './SearchBarMicButton'
import { SearchSuggestions } from './SearchSuggestions'

const SEARCH_PLACEHOLDER = 'Поиск проповедей'
const SEARCH_ICON_SIZE = 24

export const SearchBar = ({ onFocusChange }: { onFocusChange?: (isFocused: boolean) => void }) => {
  const { currentTheme } = useTheme()
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
  } = useSearchBarModel(onFocusChange)

  // Esc goes through the shared escape stack: its capture listener on document
  // sees the event before the focused input, so one path covers focus and blur.
  useEscapeKey({
    enabled: Platform.OS === 'web' && isSearchOpen,
    onEscape: handleClear,
  })

  const isQueryEmpty = inputValue.length === 0

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
        />
      )}
      {!isQueryEmpty && <SearchBarClearButton onPress={handleClearQuery} />}
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
