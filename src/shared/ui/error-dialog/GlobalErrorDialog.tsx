import { useAction, useAtom } from '@reatom/npm-react'
import { dismissErrorAction, globalErrorAtom } from '../../model/error-dialog'
import { ErrorDialog } from './ErrorDialog'

export const GlobalErrorDialog = () => {
  const [globalError] = useAtom(globalErrorAtom)
  const dismissError = useAction(dismissErrorAction)

  return (
    <ErrorDialog
      onDismiss={dismissError}
      visible={globalError !== null}
      detail={globalError?.detail ?? ''}
      message={globalError?.message ?? ''}
    />
  )
}
