import { type RefObject } from 'react'
import { type View } from 'react-native'
import { type AnchorRect, MenuDropdown } from 'shared/ui/menu'

export interface HistoryHeaderMenuDropdownProps {
  anchor: AnchorRect | null
  anchorRef?: RefObject<null | View>
  onClear: () => void
  onClose: () => void
  visible: boolean
}

export const HistoryHeaderMenuDropdown = ({
  anchor,
  anchorRef,
  onClear,
  onClose,
  visible,
}: HistoryHeaderMenuDropdownProps) => (
  <MenuDropdown
    anchor={anchor}
    visible={visible}
    onClose={onClose}
    anchorRef={anchorRef}
    items={[{ icon: 'trash-outline', onPress: onClear, text: 'Очистить историю' }]}
  />
)
