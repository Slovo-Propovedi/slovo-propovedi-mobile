import { View } from 'react-native'
import { INDENTS, useTheme } from 'shared/ui/theme'
import { ALBUM_ART_SIZE } from './PlaylistListItem'

const DIVIDER_LEFT_OFFSET = ALBUM_ART_SIZE + INDENTS.medium + INDENTS.medium

export const PlaylistListSeparator = () => {
  const { currentTheme } = useTheme()

  return (
    <View
      style={{
        backgroundColor: currentTheme.surface,
        height: 1,
        marginLeft: DIVIDER_LEFT_OFFSET,
        marginVertical: INDENTS.low,
      }}
    />
  )
}
