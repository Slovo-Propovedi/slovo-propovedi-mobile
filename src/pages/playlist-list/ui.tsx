import React from 'react'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ListenStackParamName } from 'shared/routing'
import { COLORS, FONT_SIZES, INDENTS } from 'shared/themed'
import { ListItemSize, TouchableListItem } from 'shared/ui'
import type { ListenStackScreenProps } from 'shared/routing'
import type { PlaylistData } from 'shared/types'
import type { OnPressTouchableListItem } from 'shared/ui'

export const PlaylistListScreen: React.FC<
  ListenStackScreenProps<ListenStackParamName.PlaylistList>
> = ({
  navigation: { navigate },
  route: {
    params: { playlists, title },
  },
}) => {
  const { top } = useSafeAreaInsets()

  const onPressListItem: OnPressTouchableListItem<PlaylistData> = params => {
    navigate(ListenStackParamName.Playlist, params)
  }

  return (
    <ScrollView style={styles.container}>
      <View style={[styles.titleContainer, { top }]}>
        <Text style={styles.title}>{title}</Text>
      </View>

      <View style={styles.list}>
        {playlists.map((playlist, index) => (
          <TouchableListItem
            data={playlist}
            key={playlist.title}
            onPress={onPressListItem}
            size={ListItemSize.Middle}
            previewPlaceholderText={`${index + 1}`}
          />
        ))}
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  list: { paddingLeft: INDENTS.high },
  title: {
    color: COLORS.primary,
    fontSize: FONT_SIZES.h1,
    paddingVertical: INDENTS.high,
  },
  titleContainer: {
    alignItems: 'center',
    paddingBottom: INDENTS.high,
  },
})
