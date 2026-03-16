import React from 'react'
import { StyleSheet, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { COLORS } from 'shared/themed'

export const InfoScreen = () => (
  <SafeAreaView style={styles.info}>
    <View style={{ backgroundColor: COLORS.disabled, flex: 1, paddingBottom: 100 }} />
  </SafeAreaView>
)

const styles = StyleSheet.create({ info: { backgroundColor: COLORS.white, flex: 1 } })
