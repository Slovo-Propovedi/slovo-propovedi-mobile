import { Text, View } from 'react-native'
import { useTheme } from 'shared/ui/theme'
import { PlaylistPicker } from './PlaylistPicker'
import { styles } from './styles'

const toggleId = (ids: string[], id: string) =>
  ids.includes(id) ? ids.filter(currentId => currentId !== id) : [...ids, id]

// Блок «Плейлисты раздела» (только edit-режим): выбор плейлистов, входящих в
// слайдер раздела. Состав связи — `selectedPlaylistIds`; порядок выбранных
// задаётся в детали раздела (reorder).
export const SectionFormPlaylistsFields = ({
  onChange,
  selectedIds,
}: {
  onChange: (ids: string[]) => void
  selectedIds: string[]
}) => {
  const { currentTheme } = useTheme()

  return (
    <View style={styles.playlistsBlock}>
      <Text style={[styles.blockTitle, { color: currentTheme.text }]}>Плейлисты раздела</Text>
      <PlaylistPicker
        selectedIds={selectedIds}
        onToggle={id => onChange(toggleId(selectedIds, id))}
      />
    </View>
  )
}
