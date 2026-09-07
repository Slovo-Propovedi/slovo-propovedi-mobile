import { action, atom } from '@reatom/framework'
import { ctx as rootCtx } from 'shared/lib/reatom-ctx'

export interface GlobalInfo {
  message: string
  title?: string
}

export const globalInfoAtom = atom<GlobalInfo | null>(null, 'globalInfoAtom')

// Imperative info reporter — callable from anywhere (services, listeners,
// non-React code). Uses the module-level Reatom ctx singleton.
export const showInfo = (message: string, title?: string): void => {
  globalInfoAtom(rootCtx, { message, title })
}

export const dismissInfoAction = action(ctx => {
  globalInfoAtom(ctx, null)
}, 'dismissInfoAction')
