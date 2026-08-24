import { StyleSheet, Text, View } from 'react-native'
import { type UpdateState } from 'shared/model'
import { COLORS, FONT_SIZES, INDENTS, RADIUSES } from 'shared/ui/theme'

const DOWNLOADING_TEMPLATE = 'Загрузка... '
const EXTRACTING_TEXT = 'Распаковка...'
const INSTALLING_TEXT = 'Запуск установки...'

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
  const clampedProgress = Math.min(Math.max(progress, 0), 100)

  return (
    <View>
      <View style={localStyles.progressTrack}>
        <View style={[localStyles.progressFill, { width: `${clampedProgress}%` }]} />
      </View>
      <Text style={localStyles.statusText}>{getStatusText(updateState, clampedProgress)}</Text>
    </View>
  )
}

const localStyles = StyleSheet.create({
  progressFill: {
    backgroundColor: COLORS.success,
    borderRadius: RADIUSES.low,
    height: '100%',
  },
  progressTrack: {
    backgroundColor: COLORS.disabled,
    borderRadius: RADIUSES.low,
    height: INDENTS.low,
    marginBottom: INDENTS.medium,
    overflow: 'hidden',
  },
  statusText: {
    color: COLORS.text,
    fontSize: FONT_SIZES.base,
    textAlign: 'center',
  },
})
