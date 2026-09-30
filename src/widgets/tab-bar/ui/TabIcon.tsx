import { AntDesign, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import { type ColorValue } from 'react-native'

interface IconSet<TName> {
  active: TName
  inactive: TName
}
type IoniconsName = keyof typeof Ionicons.glyphMap

type MciName = keyof typeof MaterialCommunityIcons.glyphMap

const ICON_SIZE = 22

const IONICONS_ICONS: Record<string, IconSet<IoniconsName>> = {
  book: { active: 'book', inactive: 'book-outline' },
  index: { active: 'home', inactive: 'home-outline' },
  media: { active: 'images', inactive: 'images-outline' },
  sections: { active: 'grid', inactive: 'grid-outline' },
  sermons: { active: 'mic', inactive: 'mic-outline' },
  upload: { active: 'cloud-upload', inactive: 'cloud-upload-outline' },
  users: { active: 'people', inactive: 'people-outline' },
}

const MCI_ICONS: Record<string, IconSet<MciName>> = {
  more: { active: 'dots-vertical', inactive: 'dots-vertical' },
  playlists: { active: 'playlist-music', inactive: 'playlist-music-outline' },
  study: { active: 'notebook-edit', inactive: 'notebook-edit-outline' },
}

const DEFAULT_ICONS = IONICONS_ICONS.book

// Общая карта иконок для основных и админских табов: маршрут → пара
// (активное/неактивное) имя из соответствующей icon-семьи.
export const TabIcon = ({
  color,
  isActive,
  routeName,
}: {
  color: ColorValue
  isActive: boolean
  routeName: string
}) => {
  if (routeName === 'listen') return <AntDesign color={color} size={ICON_SIZE} name='play-circle' />

  const mci = MCI_ICONS[routeName]

  if (mci)
    return (
      <MaterialCommunityIcons
        color={color}
        size={ICON_SIZE}
        name={isActive ? mci.active : mci.inactive}
      />
    )

  const ionicons = IONICONS_ICONS[routeName] ?? DEFAULT_ICONS

  return (
    <Ionicons
      color={color}
      size={ICON_SIZE}
      name={isActive ? ionicons.active : ionicons.inactive}
    />
  )
}
