import { View } from 'react-native'
import { createTracksListStyles } from 'entities/track-list'
import { useTheme } from 'shared/ui/theme'

export const OfflineSeparator = () => {
  const { currentTheme } = useTheme()
  const tracksListStyles = createTracksListStyles(currentTheme)

  return <View style={tracksListStyles.divider} />
}
