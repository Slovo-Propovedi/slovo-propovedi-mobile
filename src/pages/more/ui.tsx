import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { APP_NAME, APP_VERSION } from 'shared/config'
import { COLORS, FONT_SIZES, INDENTS } from 'shared/ui/themed'
import { TouchableItem } from 'shared/ui/touchable-item'
import type { StyleProp, ViewStyle } from 'react-native'

interface MoreMenuSettingsItemProps {
  description?: string
  icon?: keyof typeof Ionicons.glyphMap
  onPress: () => void
  style?: StyleProp<ViewStyle>
  testID?: string
  title: string
}

const MoreMenuSettingsItem = ({
  description,
  icon,
  onPress,
  style,
  testID,
  title,
}: MoreMenuSettingsItemProps) => (
  <TouchableItem testID={testID} onPress={onPress} style={[styles.itemContainer, style]}>
    <View style={styles.itemContent}>
      {icon && <Ionicons size={24} name={icon} color={COLORS.text} style={styles.itemIcon} />}
      <View style={styles.itemTextContainer}>
        <Text style={styles.itemTitle}>{title}</Text>
        {description && <Text style={styles.itemDescription}>{description}</Text>}
      </View>
    </View>
  </TouchableItem>
)

export const MoreScreen = () => {
  const router = useRouter()

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.appName}>{APP_NAME}</Text>
          <Text style={styles.appVersion}>v{APP_VERSION}</Text>
        </View>
        <Text style={styles.appDescription}>Приложение для прослушивания и чтения проповедей</Text>

        <View style={styles.menu}>
          <MoreMenuSettingsItem
            title='Настройки'
            testID='settings-item'
            icon='settings-outline'
            onPress={() => router.push('/settings')}
          />
          <MoreMenuSettingsItem
            testID='about-item'
            title='О приложении'
            icon='information-circle-outline'
            onPress={() => router.push('/about')}
          />
        </View>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  appDescription: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZES.base,
    marginBottom: INDENTS.high,
    paddingHorizontal: INDENTS.high,
  },
  appName: {
    color: COLORS.text,
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
  },
  appVersion: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZES.sm,
  },
  container: {
    backgroundColor: COLORS.background,
    flex: 1,
  },
  content: {
    flex: 1,
    paddingTop: INDENTS.high,
  },
  header: {
    alignItems: 'flex-end',
    marginBottom: INDENTS.low,
    paddingHorizontal: INDENTS.high,
  },
  itemContainer: {
    backgroundColor: COLORS.surface,
    borderBottomColor: COLORS.disabled,
    borderBottomWidth: 1,
    paddingHorizontal: INDENTS.high,
    paddingVertical: INDENTS.high,
  },
  itemContent: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  itemDescription: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZES.sm,
    marginTop: INDENTS.low,
  },
  itemIcon: {
    marginRight: INDENTS.medium,
  },
  itemTextContainer: {
    flex: 1,
  },
  itemTitle: {
    color: COLORS.text,
    fontSize: FONT_SIZES.base,
  },
  menu: {
    flex: 1,
  },
})
