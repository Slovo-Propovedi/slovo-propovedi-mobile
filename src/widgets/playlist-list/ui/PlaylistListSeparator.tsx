import { View } from 'react-native'
import { getListItemCardArtworkSize } from 'entities/list-item'
import { INDENTS, useTheme } from 'shared/ui/theme'

export const PlaylistListSeparator = () => {
  const { currentTheme } = useTheme()
  const dividerLeftOffset = getListItemCardArtworkSize() + INDENTS.medium + INDENTS.medium

  return (
    <View
      style={{
        backgroundColor: currentTheme.surface,
        height: 1,
        marginLeft: dividerLeftOffset,
        marginVertical: INDENTS.low,
      }}
    />
  )
}
