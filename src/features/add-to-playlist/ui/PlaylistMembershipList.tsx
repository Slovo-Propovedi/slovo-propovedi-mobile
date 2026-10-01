import { FlatList, StyleSheet } from 'react-native'
import { type SermonData } from 'entities/sermon'
import { INDENTS, useTheme } from 'shared/ui/theme'
import { type PlaylistMembership } from '../lib/useSortedPlaylists'
import { PlaylistMembershipRow } from './PlaylistMembershipRow'

const MAX_LIST_HEIGHT = 360
const LIST_PADDING = INDENTS.medium

// The modal's inner scroll area. Bounded height keeps the list scrollable
// instead of letting a long playlist collection grow the dialog off-screen.
export const PlaylistMembershipList = ({
  items,
  sermon,
}: {
  items: PlaylistMembership[]
  sermon: SermonData
}) => {
  const { currentTheme } = useTheme()

  return (
    <FlatList
      data={items}
      contentContainerStyle={styles.content}
      keyExtractor={item => item.playlist.id}
      style={[styles.list, { backgroundColor: currentTheme.surface }]}
      renderItem={({ item }) => (
        <PlaylistMembershipRow
          sermon={sermon}
          title={item.playlist.title}
          playlistId={item.playlist.id}
          isContained={item.isContained}
        />
      )}
    />
  )
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: LIST_PADDING,
    paddingVertical: INDENTS.low,
  },
  list: {
    maxHeight: MAX_LIST_HEIGHT,
  },
})
