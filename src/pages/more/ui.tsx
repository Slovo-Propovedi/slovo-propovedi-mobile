import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { APP_NAME, APP_VERSION } from 'shared/config'
import { COLORS, FONT_SIZES, INDENTS, useTheme } from 'shared/ui/themed'
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
}: MoreMenuSettingsItemProps) => {
  const { currentTheme } = useTheme()

  return (
    <TouchableItem
      testID={testID}
      onPress={onPress}
      style={[styles.itemContainer, { backgroundColor: currentTheme.surface }, style]}
    >
      <View style={styles.itemContent}>
        {icon && (
          <Ionicons size={24} name={icon} style={styles.itemIcon} color={currentTheme.text} />
        )}
        <View style={styles.itemTextContainer}>
          <Text style={[styles.itemTitle, { color: currentTheme.text }]}>{title}</Text>
          {description && (
            <Text style={[styles.itemDescription, { color: currentTheme.textMuted }]}>
              {description}
            </Text>
          )}
        </View>
      </View>
    </TouchableItem>
  )
}

export const MoreScreen = () => {
  const router = useRouter()
  const { currentTheme } = useTheme()

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: currentTheme.background }]}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.appName, { color: currentTheme.text }]}>{APP_NAME}</Text>
          <Text style={styles.appVersion}>v{APP_VERSION}</Text>
        </View>
        <Text style={[styles.appDescription, { color: currentTheme.textMuted }]}>
          Приложение для прослушивания и чтения проповедей
        </Text>

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
    fontSize: FONT_SIZES.base,
    marginBottom: INDENTS.high,
    paddingHorizontal: INDENTS.high,
  },
  appName: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
  },
  appVersion: {
    fontSize: FONT_SIZES.sm,
  },
  container: {
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
    fontSize: FONT_SIZES.base,
  },
  menu: {
    flex: 1,
  },
})
