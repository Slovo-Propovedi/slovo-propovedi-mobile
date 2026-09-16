import { type AnchorRect, MenuDropdown } from 'shared/ui/menu'

export interface HistoryHeaderMenuDropdownProps {
  anchor: AnchorRect | null
  onClear: () => void
  onClose: () => void
  visible: boolean
}

export const HistoryHeaderMenuDropdown = ({
  anchor,
  onClear,
  onClose,
  visible,
}: HistoryHeaderMenuDropdownProps) => (
  <MenuDropdown
    anchor={anchor}
    visible={visible}
    onClose={onClose}
    items={[{ icon: 'trash-outline', onPress: onClear, text: 'Очистить историю' }]}
  />
)
