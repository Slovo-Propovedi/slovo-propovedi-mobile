import { useLocalSearchParams, useRouter } from 'expo-router'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { booksArraySchema, getParseJsonWithSchema } from 'shared/model'
import { ListItemSize, TouchableListItem } from 'shared/ui'
import { FONT_SIZES, INDENTS, useTheme } from 'shared/ui/themed'
import type { BookData } from 'shared/model'
import type { OnPressTouchableListItem } from 'shared/ui'

const parseBooks = getParseJsonWithSchema(booksArraySchema)

export const BooksListScreen = () => {
  const { top } = useSafeAreaInsets()
  const { currentTheme } = useTheme()
  const router = useRouter()
  const params = useLocalSearchParams<{ books: string; title: string }>()

  const books = parseBooks(params.books ?? null) ?? []
  const title = params.title || ''

  const onPressListItem: OnPressTouchableListItem<BookData> = data => {
    router.push({
      params: { book: JSON.stringify(data) },
      pathname: '/read/book-reader',
    })
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: currentTheme.background }]}>
      <View style={[styles.titleContainer, { top }]}>
        <Text style={[styles.title, { color: currentTheme.text }]}>{title}</Text>
      </View>

      <View style={styles.list}>
        {books.map(book => (
          <TouchableListItem<{ artwork: string; title: string }>
            key={book.id}
            size={ListItemSize.Middle}
            data={book as { artwork: string; title: string }}
            onPress={
              onPressListItem as OnPressTouchableListItem<{ artwork: string; title: string }>
            }
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
    fontSize: FONT_SIZES.h1,
    paddingVertical: INDENTS.high,
  },
  titleContainer: {
    alignItems: 'center',
    paddingBottom: INDENTS.high,
  },
})
