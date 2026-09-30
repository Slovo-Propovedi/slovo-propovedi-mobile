import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useAction, useAtom } from '@reatom/npm-react'
import { useCallback, useMemo, useRef, useState } from 'react'
import { type ColorValue, StyleSheet, View } from 'react-native'
import { authStatusAtom, authUserAtom, signOut, useAdminEntry } from 'entities/auth'
import { IconButton } from 'shared/ui/icon-button'
import { type AnchorRect, MenuDropdown, type MenuItem } from 'shared/ui/menu'
import { useTheme } from 'shared/ui/theme'

const ICON_SIZE = 24
const BUTTON_SIZE = 44

const ADMIN_ENTRY_TEXT = 'Войти в аккаунт администратора'
const ADMIN_SIGN_OUT_TEXT = 'Выйти из аккаунта админа'

// Кебаб-меню шапки «Настроек»: единственный пункт — вход в интерфейс
// администратора (неаутентифицирован) либо выход из аккаунта администратора.
export const SettingsHeaderMenu = ({ tintColor }: { tintColor?: ColorValue }) => {
  const { currentTheme } = useTheme()
  const { openAdminInterface } = useAdminEntry()
  const signOutAction = useAction(signOut)
  const [status] = useAtom(authStatusAtom)
  const [user] = useAtom(authUserAtom)
  const [menuVisible, setMenuVisible] = useState(false)
  const [menuAnchor, setMenuAnchor] = useState<AnchorRect | null>(null)
  const buttonRef = useRef<View>(null)

  const isAuthenticated = status === 'authenticated' && user !== null

  const items = useMemo<MenuItem[]>(
    () =>
      isAuthenticated
        ? [
            {
              icon: 'log-out-outline',
              onPress: () => void signOutAction(),
              text: ADMIN_SIGN_OUT_TEXT,
            },
          ]
        : [
            {
              icon: 'shield-outline',
              onPress: () => void openAdminInterface(),
              text: ADMIN_ENTRY_TEXT,
            },
          ],
    [isAuthenticated, openAdminInterface, signOutAction],
  )

  const handleOpenMenu = useCallback(() => {
    buttonRef.current?.measureInWindow((x: number, y: number, width: number, height: number) => {
      setMenuAnchor({ height, width, x, y })
      setMenuVisible(true)
    })
  }, [])

  return (
    <>
      <View ref={buttonRef} collapsable={false}>
        <IconButton
          style={styles.button}
          onPress={handleOpenMenu}
          accessibilityLabel='Меню администратора'
          Icon={
            <MaterialCommunityIcons
              size={ICON_SIZE}
              name='dots-vertical'
              color={tintColor ?? currentTheme.text}
            />
          }
        />
      </View>

      <MenuDropdown
        items={items}
        anchor={menuAnchor}
        anchorRef={buttonRef}
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
      />
    </>
  )
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    height: BUTTON_SIZE,
    justifyContent: 'center',
    width: BUTTON_SIZE,
  },
})
