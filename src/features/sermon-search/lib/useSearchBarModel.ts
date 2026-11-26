import { useAtom, useCtx } from '@reatom/npm-react'
import { useState } from 'react'
import { searchInputRequestAtom, searchQueryAtom } from '../model'
import { searchFocusRequestAtom } from '../model-searchField'
import { useCloseSearch } from './useCloseSearch'
import { useDistinctValuesOnOpen } from './useDistinctValuesOnOpen'
import { useExternalFocusRequest } from './useExternalFocusRequest'
import { useExternalInputRequest } from './useExternalInputRequest'
import { useResetInputOnClose } from './useResetInputOnClose'
import { useSearchInputFocus } from './useSearchInputFocus'
import { useVoiceInput } from './useVoiceInput'

/**
 * Owns the input state and side effects: local text, external typing, focus
 * reporting, voice input and the clear/close semantics (⊗ and Escape).
 * @param isSearchOpen - Session open flag: the page field is always open, the retired bottom pill reads the atom.
 * @param isSearchFieldVisible - Field-on-screen flag: always true for the page field.
 * @param onFocusChange - Reports focus transitions to the field owner.
 */
export const useSearchBarModel = (
  isSearchOpen: boolean,
  isSearchFieldVisible: boolean,
  onFocusChange?: (isFocused: boolean) => void,
) => {
  const ctx = useCtx()
  const [, setQuery] = useAtom(searchQueryAtom)
  // Local state drives the input so async re-renders (spinner flips, results
  // landing) can never push a stale query back. Seeded from the atom at mount.
  const [inputValue, setInputValue] = useState(() => ctx.get(searchQueryAtom))
  const [isFocused, setIsFocused] = useState(false)
  const [hasSelectedSuggestion, setHasSelectedSuggestion] = useState(false)
  const [inputRequest] = useAtom(searchInputRequestAtom)
  const [focusRequest] = useAtom(searchFocusRequestAtom)
  const inputRef = useSearchInputFocus(isSearchFieldVisible)
  const closeSearch = useCloseSearch()
  useDistinctValuesOnOpen(isSearchOpen)
  useExternalFocusRequest(focusRequest, inputRef, isSearchFieldVisible)

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
    voiceInput.stopListening()
    setInputValue('')
    setHasSelectedSuggestion(false)
  })

  useExternalInputRequest({
    inputRequest,
    onApply: text => {
      // An empty request is a session reset (leaving the search route): the mic
      // may still be live behind the cleared field.
      if (text === '') voiceInput.stopListening()
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
    // The mic may still be live behind an empty-then-cleared field.
    voiceInput.stopListening()
    setInputValue('')
    setHasSelectedSuggestion(false)
    setQuery('')
    // The ⊗ sits inside the pill: pressing it must not hand focus away, or the
    // external ✕ and the keyboard would disappear along with the query.
    inputRef.current?.focus()
  }

  // A non-empty query clears in place; an empty one closes the whole search
  // (the same path as the external ✕ and Escape).
  const handleClear = () => {
    if (inputValue.length > 0) {
      handleClearQuery()
      return
    }

    voiceInput.stopListening()
    inputRef.current?.blur()
    closeSearch()
  }

  const handleFocusChange = (focused: boolean) => {
    // Blurring the field (tap outside, keyboard dismissal) ends the voice
    // session instead of leaving the browser microphone open.
    if (!focused) voiceInput.stopListening()
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
