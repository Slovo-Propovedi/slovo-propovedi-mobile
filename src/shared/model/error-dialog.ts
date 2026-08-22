import { action, atom } from '@reatom/framework'
import { getErrorDetail, getErrorMessage } from 'shared/lib/error-utils'
import { ctx as rootCtx } from 'shared/lib/reatom-ctx'

export interface GlobalError {
  detail: string
  message: string
}

export const globalErrorAtom = atom<GlobalError | null>(null, 'globalErrorAtom')

// Imperative error reporter — callable from anywhere (services, listeners,
// non-React code). Uses the module-level Reatom ctx singleton.
export const reportError = (error: unknown, customMessage?: string): void => {
  globalErrorAtom(rootCtx, {
    detail: getErrorDetail(error),
    message: customMessage ?? getErrorMessage(error),
  })
}

export const dismissErrorAction = action(ctx => {
  globalErrorAtom(ctx, null)
}, 'dismissErrorAction')
