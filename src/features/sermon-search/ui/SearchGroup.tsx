import { type ReactNode } from 'react'
import { View } from 'react-native'
import { SearchGroupHeader } from './SearchGroupHeader'

/**
 * Header plus rows for one result group; renders nothing when the group is empty.
 * @param root0 - Component props.
 * @param root0.children - Rows rendered under the group header.
 * @param root0.count - Number of matches, shown in the header and gating visibility.
 * @param root0.label - Group title shown in the header.
 * @param root0.onPress - Called when the header is pressed (e.g. To show all matches).
 */
export const SearchGroup = ({
  children,
  count,
  label,
  onPress,
}: {
  children: ReactNode
  count: number
  label: string
  onPress: () => void
}) => {
  if (count === 0) return null

  return (
    <View>
      <SearchGroupHeader count={count} label={label} onPress={onPress} />
      {children}
    </View>
  )
}
