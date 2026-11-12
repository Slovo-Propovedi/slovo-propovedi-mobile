import { action, atom } from '@reatom/framework'
import { requestSearchFocus } from 'features/sermon-search'
import { clearSearchHistoryAction } from 'entities/search-history'

// The «Недавние поиски» clear-confirmation lives at page level, not in the
// section: the tap blurs the field, the page switches to the blurred pose and
// the section unmounts, so state owned by the section would take the dialog
// with it. The atom survives every pose switch.
export const isClearHistoryDialogVisibleAtom = atom(false, 'isClearHistoryDialogVisibleAtom')

// The press blurs the input and the modal keeps focus while open, so every
// close path raises the focus request: before the dialog and once it closes.
export const openClearHistoryDialog = action(ctx => {
  requestSearchFocus(ctx)
  isClearHistoryDialogVisibleAtom(ctx, true)
}, 'openClearHistoryDialog')

// Cancel button, Android back (Modal.onRequestClose) and web Escape all dismiss
// through this action (ConfirmDialog has no backdrop-press dismissal).
export const closeClearHistoryDialog = action(ctx => {
  isClearHistoryDialogVisibleAtom(ctx, false)
  requestSearchFocus(ctx)
}, 'closeClearHistoryDialog')

export const confirmClearHistory = action(ctx => {
  isClearHistoryDialogVisibleAtom(ctx, false)
  void clearSearchHistoryAction(ctx)
  requestSearchFocus(ctx)
}, 'confirmClearHistory')
