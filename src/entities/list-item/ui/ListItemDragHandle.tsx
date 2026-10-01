import Ionicons from '@expo/vector-icons/Ionicons'
import { IconButton } from 'shared/ui/icon-button'
import { useTheme } from 'shared/ui/theme'

export const ListItemDragHandle = ({ label, onDrag }: { label: string; onDrag: () => void }) => {
  const { currentTheme } = useTheme()

  return (
    <IconButton
      onPressIn={onDrag}
      accessibilityLabel={label}
      Icon={<Ionicons size={26} name='reorder-three' color={currentTheme.textMuted} />}
    />
  )
}
