import { useAction, useAtom, useCtx } from '@reatom/npm-react'
import { useState } from 'react'
import { Keyboard } from 'react-native'
import { isSearchOpenAtom, searchInputRequestAtom, searchQueryAtom } from '../model'
import { isSearchFieldVisibleAtom } from '../model-searchField'
import { closeSearch } from '../model-session'
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
  // The pill is hidden while the collapsed bar keeps an empty query. A hidden
  // field must release focus: a lingering keyboard covers the collapsed row and
  // the first tap on the search circle is spent on the focus handoff instead of
  // reopening the search.
  const [isSearchFieldVisible] = useAtom(isSearchFieldVisibleAtom)
  // Local state drives the input so async re-renders (spinner flips, results
  // landing) can never push a stale query back. Seeded from the atom at mount.
  const [inputValue, setInputValue] = useState(() => ctx.get(searchQueryAtom))
  const [isFocused, setIsFocused] = useState(false)
  const [hasSelectedSuggestion, setHasSelectedSuggestion] = useState(false)
  const [inputRequest] = useAtom(searchInputRequestAtom)
  const inputRef = useSearchInputFocus(isSearchFieldVisible)
  const closeSearchAction = useAction(closeSearch)
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
    voiceInput.stopListening()
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
    // The mic may still be live behind an empty-then-cleared field.
    voiceInput.stopListening()
    setInputValue('')
    setHasSelectedSuggestion(false)
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

    voiceInput.stopListening()
    inputRef.current?.blur()
    Keyboard.dismiss()
    void closeSearchAction()
  }

  const handleFocusChange = (focused: boolean) => {
    // Blurring the field (tap outside, tab switch, keyboard dismissal) ends the
    // voice session instead of leaving the browser microphone open.
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
