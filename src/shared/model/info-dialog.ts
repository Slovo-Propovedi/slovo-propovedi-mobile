import { action, atom } from '@reatom/framework'
import { ctx as rootCtx } from '../lib/reatom-ctx/ctx'

export interface GlobalInfo {
  message: string
  // Runs after the dialog closes, regardless of the dismissal path (confirm,
  // cancel, system back, Escape). Callers use it to restore what the dialog
  // took away, e.g. search-input focus.
  onDismiss?: () => void
  title?: string
}

export const globalInfoAtom = atom<GlobalInfo | null>(null, 'globalInfoAtom')

// Imperative info reporter — callable from anywhere (services, listeners,
// non-React code). Uses the module-level Reatom ctx singleton.
export const showInfo = (
  message: string,
  title?: string,
  options?: { onDismiss?: () => void },
): void => {
  globalInfoAtom(rootCtx, { message, onDismiss: options?.onDismiss, title })
}

export const dismissInfoAction = action(ctx => {
  globalInfoAtom(ctx, null)
}, 'dismissInfoAction')
