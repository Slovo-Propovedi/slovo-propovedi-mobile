import { type ErrorBoundaryProps, Stack } from 'expo-router'
import { ErrorDialog } from 'shared/ui/error-dialog'
import { COLORS } from 'shared/ui/themed'

/**
 * Error boundary component for the more route group.
 * @param root0 - Error boundary props.
 * @param root0.error - The error that was thrown.
 * @param root0.retry - Function to retry rendering the errored route.
 */
export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  return (
    <ErrorDialog
      visible
      onDismiss={retry}
      message={error.message}
      detail={error.stack || String(error)}
    />
  )
}

const MoreStackLayout = () => (
  <Stack
    screenOptions={{
      headerBackTitle: 'Назад',
      headerStyle: { backgroundColor: COLORS.background },
      headerTintColor: COLORS.text,
      headerTitleStyle: { color: COLORS.text },
    }}
  >
    <Stack.Screen
      name='settings'
      options={{ title: 'Настройки' }}
    />
  </Stack>
)

export default MoreStackLayout
