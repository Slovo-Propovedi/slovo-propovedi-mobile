import { ScrollView, StyleSheet, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { INDENTS, useTheme } from 'shared/ui/theme'
import type { XMLElementElement } from './model'
import { parseObjectToStylizedElements } from './lib'
import { parseFb2BookToObject } from './lib/parseFb2BookToObject'
import { BodyXMLElementName, XMLElementType } from './model'
import { testFb2String } from './testFiles/testFb2'

export const BookReaderScreen = () => {
  const { currentTheme } = useTheme()
  const book = parseFb2BookToObject(testFb2String)

  if (!book) return null

  const { elements } = book

  const body = elements.find(
    ({ name, type }) => type === XMLElementType.Element && name === BodyXMLElementName.Body,
  )

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: currentTheme.background }]}>
      <View style={styles.content}>
        <ScrollView>
          {body &&
            parseObjectToStylizedElements({
              element: body as XMLElementElement,
              theme: currentTheme,
            })}
        </ScrollView>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: INDENTS.middle,
  },
})
