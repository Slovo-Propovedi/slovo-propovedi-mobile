import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useCallback, useRef, useState } from 'react'
import { View, type ViewInstance } from 'react-native'
import { type APITypes } from 'shared/api'
import { ConfirmDialog } from 'shared/ui/confirm-dialog'
import { IconButton } from 'shared/ui/icon-button'
import { type AnchorRect, MenuDropdown } from 'shared/ui/menu'
import { useTheme } from 'shared/ui/theme'
import { useSetArtworkFromPlaylist } from '../lib/useSetArtworkFromPlaylist'

const MENU_BUTTON_LABEL = 'Меню проповедей плейлиста'
const MENU_ITEM_TEXT = 'Установить обложки из плейлиста'
const DIALOG_TITLE = 'Установить обложки из плейлиста?'
const ICON_SIZE = 24

// Кнопка ⋯ у заголовка «Проповеди плейлиста» с единственным пунктом — назначить
// всем проповедям обложку плейлиста (с подтверждением). Рендерится только при
// непустом списке проповедей (вызывающая сторона).
export const PlaylistSermonsMenu = ({
  playlist,
  refresh,
  sermons,
}: {
  playlist: APITypes.PlaylistEntity
  refresh: () => Promise<void>
  sermons: APITypes.PlaylistSermon[]
}) => {
  const { currentTheme } = useTheme()
  const buttonRef = useRef<ViewInstance>(null)
  const [anchor, setAnchor] = useState<AnchorRect | null>(null)
  const [isMenuVisible, setMenuVisible] = useState(false)
  const { closeConfirm, confirm, isConfirmVisible, openConfirm } = useSetArtworkFromPlaylist({
    playlist,
    refresh,
    sermons,
  })

  const handleOpenMenu = useCallback(() => {
    buttonRef.current?.measureInWindow((x: number, y: number, width: number, height: number) => {
      setAnchor({ height, width, x, y })
      setMenuVisible(true)
    })
  }, [])

  return (
    <>
      <View ref={buttonRef} collapsable={false}>
        <IconButton
          onPress={handleOpenMenu}
          accessibilityLabel={MENU_BUTTON_LABEL}
          Icon={
            <MaterialCommunityIcons
              size={ICON_SIZE}
              name='dots-horizontal'
              color={currentTheme.text}
            />
          }
        />
      </View>
      <MenuDropdown
        anchor={anchor}
        anchorRef={buttonRef}
        visible={isMenuVisible}
        onClose={() => setMenuVisible(false)}
        items={[
          {
            icon: 'image-multiple-outline',
            iconFamily: 'material-community',
            onPress: openConfirm,
            text: MENU_ITEM_TEXT,
          },
        ]}
      />
      <ConfirmDialog
        title={DIALOG_TITLE}
        onCancel={closeConfirm}
        visible={isConfirmVisible}
        onConfirm={() => void confirm()}
        message={`Обложка плейлиста будет назначена всем проповедям (${sermons.length}).`}
      />
    </>
  )
}
