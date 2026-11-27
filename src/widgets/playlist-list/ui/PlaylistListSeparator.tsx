import { View } from 'react-native'
import { getListItemCardArtworkSize } from 'entities/list-item'
import { useLayoutBaseWidth } from 'shared/ui/layout'
import { INDENTS, useTheme } from 'shared/ui/theme'

export const PlaylistListSeparator = () => {
  const { currentTheme } = useTheme()
  const baseWidth = useLayoutBaseWidth()
  const dividerLeftOffset = getListItemCardArtworkSize(baseWidth) + INDENTS.medium + INDENTS.medium

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
