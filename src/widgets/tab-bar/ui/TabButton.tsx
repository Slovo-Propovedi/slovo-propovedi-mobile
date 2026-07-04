import { AntDesign, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import { Text, TouchableOpacity, View } from 'react-native'
import { COLORS } from 'shared/ui/themed'
import { styles } from './styles'

interface TabButtonProps {
  isActive: boolean
  isDisabled?: boolean
  onLayout: (layout: { width: number; x: number }) => void
  onPress: () => void
  routeKey: string
  routeName: string
}

export const TabButton = ({
  isActive,
  isDisabled,
  onLayout,
  onPress,
  routeKey,
  routeName,
}: TabButtonProps) => {
  const color = isActive ? COLORS.tabBarActive : COLORS.tabBarInactive

  const getIcon = () => {
    if (routeName === 'study')
      return (
        <MaterialCommunityIcons
          size={22}
          color={color}
          name={isActive ? 'notebook-edit' : 'notebook-edit-outline'}
        />
      )

    if (routeName === 'listen') return <AntDesign size={22} color={color} name='play-circle' />

    if (routeName === 'info')
      return <MaterialCommunityIcons size={22} color={color} name='dots-vertical' />

    return <Ionicons size={22} color={color} name={isActive ? 'book' : 'book-outline'} />
  }

  const displayName =
    routeName === 'listen'
      ? 'Слушать'
      : routeName === 'read'
        ? 'Читать'
        : routeName === 'study'
          ? 'Учиться'
          : 'Еще'

  return (
    <TouchableOpacity
      key={routeKey}
      onPress={onPress}
      style={[styles.tabButton, isDisabled && styles.disabledTabButton]}
      onLayout={e =>
        onLayout({
          width: e.nativeEvent.layout.width,
          x: e.nativeEvent.layout.x,
        })
      }
    >
      <View style={styles.tabItem}>
        {getIcon()}
        <Text style={[styles.tabText, { color }]}>{displayName}</Text>
      </View>
    </TouchableOpacity>
  )
}
