import { Text } from 'react-native'
import { FONT_SIZES, useTheme } from 'shared/ui/theme'

const EMPTY_HISTORY_MESSAGE = 'История пуста'

export const HistoryEmptyState = () => {
  const { currentTheme } = useTheme()

  return (
    <Text
      style={{
        color: currentTheme.textMuted,
        flex: 1,
        fontSize: FONT_SIZES.lg,
        textAlign: 'center',
      }}
    >
      {EMPTY_HISTORY_MESSAGE}
    </Text>
  )
}
