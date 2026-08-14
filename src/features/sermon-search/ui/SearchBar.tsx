import { useAction, useAtom, useCtx } from '@reatom/npm-react'
import { useEffect, useRef, useState } from 'react'
import { Keyboard, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { FONT_SIZES, INDENTS, RADIUSES, useTheme } from 'shared/ui/themed'
import { SEARCH_HEADER_HEIGHT } from '../lib/constants'
import { closeSearch, resetSearchResults, searchQueryAtom } from '../model'

const SEARCH_PLACEHOLDER = 'Поиск проповедей'
const CLEAR_LABEL = 'Очистить поиск'
const CLEAR_SYMBOL = '✕'

export const SearchBar = () => {
  const { currentTheme } = useTheme()
  const ctx = useCtx()
  const [, setQuery] = useAtom(searchQueryAtom)
  // Local state drives the input so async re-renders (spinner flips, results
  // landing) can never push a stale query back. Seeded from the atom at mount.
  const [inputValue, setInputValue] = useState(() => ctx.get(searchQueryAtom))
  const [isFocused, setIsFocused] = useState(false)
  const inputRef = useRef<TextInput>(null)
  const hasFocusedOnMount = useRef(false)
  const closeSearchAction = useAction(closeSearch)
  const resetSearchResultsAction = useAction(resetSearchResults)

  useEffect(() => {
    if (Platform.OS === 'web') return

    const hideSubscription = Keyboard.addListener('keyboardDidHide', () => {
      // A hide left over from a previous dismissal can arrive right after
      // mount and would kill the autofocus — ignore it until focus is applied.
      if (!hasFocusedOnMount.current) return
      inputRef.current?.blur()
      setIsFocused(false)
    })

    return () => hideSubscription.remove()
  }, [])

  // Focus one frame after mount: on Android a focus request issued before the
  // bar is laid out is dropped, so the keyboard never appears.
  useEffect(() => {
    const focusFrame = requestAnimationFrame(() => {
      inputRef.current?.focus()
      hasFocusedOnMount.current = true
    })

    return () => cancelAnimationFrame(focusFrame)
  }, [])

  const handleChangeText = (text: string) => {
    setInputValue(text)
    setQuery(text)
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
      <Pressable
        hitSlop={INDENTS.low}
        onPress={handleClear}
        accessibilityRole='button'
        style={styles.clearButton}
        accessibilityLabel={CLEAR_LABEL}
      >
        <Text style={[styles.clearIcon, { color: currentTheme.textMuted }]}>{CLEAR_SYMBOL}</Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  clearButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: INDENTS.medium,
  },
  clearIcon: {
    fontSize: FONT_SIZES.lg,
  },
  container: {
    borderRadius: RADIUSES.middle,
    flex: 1,
    flexDirection: 'row',
    height: SEARCH_HEADER_HEIGHT - 2 * INDENTS.low,
    marginHorizontal: INDENTS.medium,
  },
  input: {
    borderRadius: RADIUSES.middle,
    borderWidth: 1,
    flex: 1,
    fontSize: FONT_SIZES.md,
    lineHeight: FONT_SIZES.md + INDENTS.lowest,
    paddingHorizontal: INDENTS.medium,
    paddingVertical: 0,
    textAlignVertical: 'center',
  },
})
