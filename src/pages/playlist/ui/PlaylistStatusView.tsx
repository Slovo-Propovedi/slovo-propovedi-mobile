import { StatusBar, type StatusBarStyle } from 'expo-status-bar'
import { ActivityIndicator, Text, View } from 'react-native'
import { type ThemeColors } from 'shared/ui/theme'
import { type createStyles } from './styles'

interface PlaylistStatusViewProps {
  notFound: boolean
  statusBarStyle: StatusBarStyle
  styles: ReturnType<typeof createStyles>
  theme: ThemeColors
}

export const PlaylistStatusView = ({
  notFound,
  statusBarStyle,
  styles,
  theme,
}: PlaylistStatusViewProps) => (
  <View style={styles.centered}>
    <StatusBar style={statusBarStyle} />
    {notFound ? (
      <Text style={styles.emptyText}>Плейлист не найден</Text>
    ) : (
      <ActivityIndicator size='large' color={theme.primary} />
    )}
  </View>
)
