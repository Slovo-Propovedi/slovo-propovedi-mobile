import React from 'react'
import { ScrollView, StatusBar, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { ListenEveryDaySlider } from 'widgets/listen-every-day-slider'
import { NewSermonsSlider } from 'widgets/new-sermons-slider'
import { SermonsOnBibleSlider } from 'widgets/sermons-on-bible-slider'
import { TopicalListSlider } from 'widgets/topical-list-slider'
import { COLORS } from 'shared/themed'
import type { ListenStackParamName, ListenStackScreenProps } from 'shared/routing'

export const ListenScreen: React.FC<
  ListenStackScreenProps<ListenStackParamName.ListenHome>
> = () => (
  <SafeAreaView style={styles.listen}>
    <StatusBar translucent barStyle='dark-content' backgroundColor='transparent' />

    <ScrollView style={styles.content}>
      <NewSermonsSlider />
      <SermonsOnBibleSlider />
      <TopicalListSlider />
      <ListenEveryDaySlider />
    </ScrollView>
  </SafeAreaView>
)

const styles = StyleSheet.create({
  content: {
    backgroundColor: COLORS.white,
    flex: 1,
    paddingBottom: 100,
  },
  listen: {
    backgroundColor: COLORS.white,
    flex: 1,
  },
})
