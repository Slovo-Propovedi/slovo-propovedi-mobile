import { Fragment } from 'react'
import { type StyleProp, View, type ViewStyle } from 'react-native'
import { useTheme } from 'shared/ui/theme'
import { createTracksListStyles } from './styles'
import { TracksListItemSkeleton } from './TracksListItemSkeleton'

const DEFAULT_ROW_COUNT = 6

interface TracksListSkeletonProps {
  /** Number of placeholder rows to render. */
  rowCount?: number
  /** Style applied to every row (e.g. Screen horizontal margins). */
  rowStyle?: StyleProp<ViewStyle>
  /** Render the standard track-list divider between rows. */
  showDividers?: boolean
}

export const TracksListSkeleton = ({
  rowCount = DEFAULT_ROW_COUNT,
  rowStyle,
  showDividers = true,
}: TracksListSkeletonProps) => {
  const { currentTheme } = useTheme()
  const tracksListStyles = createTracksListStyles(currentTheme)

  return (
    <>
      {Array.from({ length: rowCount }, (_, index) => (
        <Fragment key={index}>
          {showDividers && index > 0 && <View style={tracksListStyles.divider} />}
          <TracksListItemSkeleton style={rowStyle} />
        </Fragment>
      ))}
    </>
  )
}
