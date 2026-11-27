import Ionicons from '@expo/vector-icons/Ionicons'
import { RefreshButton } from 'shared/ui'
import { IconButton } from 'shared/ui/icon-button'
import { useTheme } from 'shared/ui/theme'

// Compact renders these in the list header; wide floats them in WideTopActions.
export const AdminSermonsTopActions = ({ onCreate }: { onCreate: () => void }) => {
  const { currentTheme } = useTheme()

  return (
    <>
      <RefreshButton />
      <IconButton
        onPress={onCreate}
        accessibilityLabel='Загрузить проповедь'
        Icon={<Ionicons size={24} name='add-outline' color={currentTheme.primary} />}
      />
    </>
  )
}
