import { View } from 'react-native'
import { useTheme } from 'shared/ui/themed'
import { createTracksListStyles } from 'shared/ui/track-list'

export const HistorySeparator = () => {
  const { currentTheme } = useTheme()
  const tracksListStyles = createTracksListStyles(currentTheme)

  return <View style={tracksListStyles.divider} />
}
