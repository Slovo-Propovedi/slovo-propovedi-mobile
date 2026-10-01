import { StyleSheet, View } from 'react-native'
import { type LocalPlaylistData, type LocalSectionSettings } from 'entities/playlist'
import { FormGroupTitle } from 'shared/ui/form'
import { FONT_SIZES, INDENTS, useTheme } from 'shared/ui/theme'
import { MyPlaylistsAppearanceForm } from './MyPlaylistsAppearanceForm'
import { MyPlaylistsFavoritesRow } from './MyPlaylistsFavoritesRow'

const APPEARANCE_TITLE = 'Оформление'
const PLAYLISTS_TITLE = 'Плейлисты раздела'

// Шапка режима редактирования: блок «Оформление» (поля оформления применяются
// мгновенно) и закреплённая строка «Избранные» с заголовком «Плейлисты раздела».
export const MyPlaylistsEditHeader = ({
  favorites,
  onAppearanceChange,
  onPressFavorites,
  settings,
}: {
  favorites: LocalPlaylistData
  onAppearanceChange: (patch: Partial<LocalSectionSettings>) => void
  onPressFavorites: () => void
  settings: LocalSectionSettings
}) => {
  const { currentTheme } = useTheme()

  return (
    <View style={styles.header}>
      <FormGroupTitle style={[styles.groupTitle, { color: currentTheme.text }]}>
        {APPEARANCE_TITLE}
      </FormGroupTitle>
      <MyPlaylistsAppearanceForm settings={settings} onChange={onAppearanceChange} />
      <FormGroupTitle
        style={[styles.groupTitle, styles.playlistsTitle, { color: currentTheme.text }]}
      >
        {PLAYLISTS_TITLE}
      </FormGroupTitle>
      <MyPlaylistsFavoritesRow playlist={favorites} onPress={onPressFavorites} />
    </View>
  )
}

const styles = StyleSheet.create({
  groupTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    marginBottom: INDENTS.low,
  },
  header: { paddingHorizontal: INDENTS.medium, paddingTop: INDENTS.medium },
  playlistsTitle: { marginTop: INDENTS.highest },
})
