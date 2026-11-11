import Ionicons from '@expo/vector-icons/Ionicons'
import { useAction } from '@reatom/npm-react'
import { useRouter } from 'expo-router'
import { useCallback, useRef, useState } from 'react'
import { Text, View, type ViewInstance } from 'react-native'
import { signOut } from 'entities/auth'
import { type APITypes } from 'shared/api'
import { IconButton } from 'shared/ui/icon-button'
import { type AnchorRect, MenuDropdown, type MenuItem } from 'shared/ui/menu'
import { useTheme } from 'shared/ui/theme'
import { styles } from './styles'

const ICON_SIZE = 24
const SIGN_OUT_TEXT = 'Выйти из аккаунта'

export const AdminHomeUserMenu = ({ user }: { user: APITypes.UserResponse | null }) => {
  const router = useRouter()
  const signOutAction = useAction(signOut)
  const { currentTheme } = useTheme()
  const [menuVisible, setMenuVisible] = useState(false)
  const [menuAnchor, setMenuAnchor] = useState<AnchorRect | null>(null)
  const buttonRef = useRef<ViewInstance>(null)

  const handleSignOut = async () => {
    await signOutAction()
    router.replace('/listen')
  }

  const items: MenuItem[] = [
    { icon: 'log-out-outline', onPress: () => void handleSignOut(), text: SIGN_OUT_TEXT },
  ]

  const handleOpenMenu = useCallback(() => {
    buttonRef.current?.measureInWindow((x: number, y: number, width: number, height: number) => {
      setMenuAnchor({ height, width, x, y })
      setMenuVisible(true)
    })
  }, [])

  return (
    <View style={styles.userMenu}>
      <View ref={buttonRef} collapsable={false}>
        <IconButton
          onPress={handleOpenMenu}
          accessibilityLabel='Меню пользователя'
          Icon={<Ionicons size={ICON_SIZE} name='person-outline' color={currentTheme.text} />}
        />
      </View>
      {user !== null && (
        <Text style={[styles.userCaption, { color: currentTheme.textMuted }]}>{user.name}</Text>
      )}
      <MenuDropdown
        items={items}
        anchor={menuAnchor}
        anchorRef={buttonRef}
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
      />
    </View>
  )
}
