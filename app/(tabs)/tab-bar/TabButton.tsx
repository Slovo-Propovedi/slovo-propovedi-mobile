import { AntDesign, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import { Text, TouchableOpacity, View } from 'react-native'
import { COLORS } from 'shared/themed'
import { styles } from './styles'

interface TabButtonProps {
  routeKey: string
  routeName: string
  isActive: boolean
  onPress: () => void
  onLayout: (layout: { width: number; x: number }) => void
}

export const TabButton = ({ routeKey, routeName, isActive, onPress, onLayout }: TabButtonProps) => {
  const color = isActive ? COLORS.black : '#555'

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
      return (
        <Ionicons size={22} color={color} name={isActive ? 'information' : 'information-outline'} />
      )

    return <Ionicons size={22} color={color} name={isActive ? 'book' : 'book-outline'} />
  }

  const displayName =
    routeName === 'listen'
      ? 'Слушать'
      : routeName === 'read'
        ? 'Читать'
        : routeName === 'study'
          ? 'Учиться'
          : 'Информация'

  return (
    <TouchableOpacity
      key={routeKey}
      onPress={onPress}
      style={styles.tabButton}
      onLayout={e =>
        onLayout({
          width: e.nativeEvent.layout.width,
          x: e.nativeEvent.layout.x,
        })
      }
    >
      <View style={styles.tabItem}>
        {getIcon()}
        {isActive && <Text style={[styles.tabText, { color }]}>{displayName}</Text>}
      </View>
    </TouchableOpacity>
  )
}
