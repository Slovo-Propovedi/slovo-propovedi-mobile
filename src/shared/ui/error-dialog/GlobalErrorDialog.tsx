import { useAction, useAtom } from '@reatom/npm-react'
import { useState } from 'react'
import { dismissErrorAction, type GlobalError, globalErrorAtom } from '../../model/error-dialog'
import { ErrorDialog } from './ErrorDialog'

export const GlobalErrorDialog = () => {
  const [globalError] = useAtom(globalErrorAtom)
  const dismissError = useAction(dismissErrorAction)
  const [lastShownError, setLastShownError] = useState<GlobalError | null>(null)

  // Keep the previous error text on screen while the dialog fades out: dismissing
  // clears the atom immediately, but the modal stays visible for the animation.
  if (globalError !== null && globalError !== lastShownError) setLastShownError(globalError)

  const shownError = globalError ?? lastShownError

  return (
    <ErrorDialog
      onDismiss={dismissError}
      visible={globalError !== null}
      detail={shownError?.detail ?? ''}
      message={shownError?.message ?? ''}
    />
  )
}
