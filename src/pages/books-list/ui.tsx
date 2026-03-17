import { useLocalSearchParams, useRouter } from 'expo-router'
import React from 'react'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { COLORS, FONT_SIZES, INDENTS } from 'shared/themed'
import { ListItemSize, TouchableListItem } from 'shared/ui'
import type { BookData } from 'shared/model'
import type { OnPressTouchableListItem } from 'shared/ui'

export const BooksListScreen = () => {
  const { top } = useSafeAreaInsets()
  const router = useRouter()
  const params = useLocalSearchParams<{ books: string; title: string }>()

  const books = params.books ? (JSON.parse(params.books as string) as BookData[]) : []
  const title = params.title || ''

  const onPressListItem: OnPressTouchableListItem<BookData> = data => {
    router.push({
      params: { book: JSON.stringify(data) },
      pathname: '/read/book-reader',
    })
  }

  return (
    <ScrollView style={styles.container}>
      <View style={[styles.titleContainer, { top }]}>
        <Text style={styles.title}>{title}</Text>
      </View>

      <View style={styles.list}>
        {books.map((book, index) => (
          <TouchableListItem
            data={book}
            key={book.id}
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
    backgroundColor: COLORS.background,
    flex: 1,
  },
  list: { paddingLeft: INDENTS.high },
  title: {
    color: COLORS.text,
    fontSize: FONT_SIZES.h1,
    paddingVertical: INDENTS.high,
  },
  titleContainer: {
    alignItems: 'center',
    paddingBottom: INDENTS.high,
  },
})
