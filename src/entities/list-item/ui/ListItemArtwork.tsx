import { CoverImage } from 'shared/ui'
import { useTheme } from 'shared/ui/theme'
import { createListItemBaseStyles } from './styles'
import { type ListItemVariant } from './types'

export const ListItemArtwork = ({
  uri,
  variant,
}: {
  uri: null | string
  variant: ListItemVariant
}) => {
  const { currentTheme } = useTheme()
  const styles = createListItemBaseStyles(currentTheme)

  return (
    <CoverImage uri={uri} style={variant === 'card' ? styles.cardArtwork : styles.surfaceArtwork} />
  )
}
