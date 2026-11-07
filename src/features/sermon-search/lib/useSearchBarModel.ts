import { useAction, useAtom, useCtx } from '@reatom/npm-react'
import { useState } from 'react'
import { Keyboard } from 'react-native'
import {
  closeSearch,
  isSearchOpenAtom,
  resetSearchResults,
  searchInputRequestAtom,
  searchQueryAtom,
} from '../model'
import { useDistinctValuesOnOpen } from './useDistinctValuesOnOpen'
import { useExternalInputRequest } from './useExternalInputRequest'
import { useResetInputOnClose } from './useResetInputOnClose'
import { useSearchInputFocus } from './useSearchInputFocus'
import { useVoiceInput } from './useVoiceInput'

/**
 * Owns the search bar's input state and side effects: the local text that drives
 * the field, the external-typing channel, focus reporting, voice input and the
 * clear/close semantics shared by the inline ⊗ and Escape.
 * @param onFocusChange - Reports focus transitions to the island owner.
 * @returns Input state, focus state and the handlers the bar renders.
 */
export const useSearchBarModel = (onFocusChange?: (isFocused: boolean) => void) => {
  const ctx = useCtx()
  const [, setQuery] = useAtom(searchQueryAtom)
  const [isSearchOpen] = useAtom(isSearchOpenAtom)
  // Local state drives the input so async re-renders (spinner flips, results
  // landing) can never push a stale query back. Seeded from the atom at mount.
  const [inputValue, setInputValue] = useState(() => ctx.get(searchQueryAtom))
  const [isFocused, setIsFocused] = useState(false)
  const [hasSelectedSuggestion, setHasSelectedSuggestion] = useState(false)
  const [inputRequest] = useAtom(searchInputRequestAtom)
  const inputRef = useSearchInputFocus(isSearchOpen)
  const closeSearchAction = useAction(closeSearch)
  const resetSearchResultsAction = useAction(resetSearchResults)
  useDistinctValuesOnOpen(isSearchOpen)

  const handleChangeText = (text: string) => {
    setInputValue(text)
    setQuery(text)
    setHasSelectedSuggestion(false)
  }

  const voiceInput = useVoiceInput({
    onTranscript: text => {
      handleChangeText(text)
      inputRef.current?.focus()
    },
  })

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

  const handleSelectSuggestion = (value: string) => {
    setInputValue(value)
    setQuery(value)
    setHasSelectedSuggestion(true)
  }

  const handleClearQuery = () => {
    setInputValue('')
    setHasSelectedSuggestion(false)
    void resetSearchResultsAction()
    setQuery('')
    // The ⊗ sits inside the pill: pressing it must not hand focus away, or the
    // external ✕ and the keyboard would disappear along with the query.
    inputRef.current?.focus()
  }

  // The pill has no always-visible close chip anymore: a non-empty query clears
  // in place, an empty one closes the whole search (Escape path).
  const handleClear = () => {
    if (inputValue.length > 0) {
      handleClearQuery()
      return
    }

    inputRef.current?.blur()
    Keyboard.dismiss()
    void closeSearchAction()
  }

  const handleFocusChange = (focused: boolean) => {
    setIsFocused(focused)
    onFocusChange?.(focused)
  }

  return {
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
  }
}
