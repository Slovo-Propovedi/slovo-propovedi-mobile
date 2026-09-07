import { StyleSheet, Text, View } from 'react-native'
import { type UpdateState } from 'shared/model'
import { FONT_SIZES, INDENTS, RADIUSES, useTheme } from 'shared/ui/theme'

const DOWNLOADING_TEMPLATE = 'Загрузка... '
const EXTRACTING_TEXT = 'Распаковка...'
const INSTALLING_TEXT = 'Запуск установки...'
const TRACK_OPACITY = 0.3

const getStatusText = (updateState: UpdateState, progress: number): string => {
  if (updateState === 'extracting') return EXTRACTING_TEXT
  if (updateState === 'installing') return INSTALLING_TEXT
  return `${DOWNLOADING_TEMPLATE}${Math.round(progress)}%`
}

interface UpdateDialogProgressProps {
  progress: number
  updateState: UpdateState
}

export const UpdateDialogProgress = ({ progress, updateState }: UpdateDialogProgressProps) => {
  const { currentTheme } = useTheme()
  const clampedProgress = Math.min(Math.max(progress, 0), 100)

  return (
    <View>
      <View
        style={[
          localStyles.progressTrack,
          { backgroundColor: currentTheme.textMuted, opacity: TRACK_OPACITY },
        ]}
      >
        <View
          style={[
            localStyles.progressFill,
            { backgroundColor: currentTheme.primary, width: `${clampedProgress}%` },
          ]}
        />
      </View>
      <Text style={[localStyles.statusText, { color: currentTheme.textMuted }]}>
        {getStatusText(updateState, clampedProgress)}
      </Text>
    </View>
  )
}

const localStyles = StyleSheet.create({
  progressFill: {
    borderRadius: RADIUSES.low,
    height: '100%',
  },
  progressTrack: {
    borderRadius: RADIUSES.low,
    height: INDENTS.low,
    marginBottom: INDENTS.medium,
    overflow: 'hidden',
  },
  statusText: {
    fontSize: FONT_SIZES.base,
    textAlign: 'center',
  },
})
