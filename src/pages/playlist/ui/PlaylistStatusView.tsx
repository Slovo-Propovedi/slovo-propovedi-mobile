import { StatusBar, type StatusBarStyle } from 'expo-status-bar'
import { ActivityIndicator, Text, View } from 'react-native'
import { type ThemeColors } from 'shared/ui/theme'
import { type createStyles } from './styles'

export const PlaylistStatusView = ({
  notFound,
  statusBarStyle,
  styles,
  theme,
}: {
  notFound: boolean
  statusBarStyle: StatusBarStyle
  styles: ReturnType<typeof createStyles>
  theme: ThemeColors
}) => (
  <View style={styles.centered}>
    <StatusBar style={statusBarStyle} />
    {notFound ? (
      <Text style={styles.emptyText}>Плейлист не найден</Text>
    ) : (
      <ActivityIndicator size='large' color={theme.primary} />
    )}
  </View>
)
