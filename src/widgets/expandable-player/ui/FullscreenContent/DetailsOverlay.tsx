import { Entypo } from '@expo/vector-icons'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { FONT_SIZES, INDENTS } from 'shared/ui/theme'
import type { createStyles } from '../ExpandablePlayer/styles'
import type { AudioPlayerData } from 'shared/model'

interface DetailsOverlayProps {
  audio: AudioPlayerData
  insetsTop: number
  onClose: () => void
  styles: ReturnType<typeof createStyles>
}

const HEADER_OFFSET = 60

const localStyles = StyleSheet.create({
  authorText: {
    color: '#fff',
    fontSize: FONT_SIZES.base,
    lineHeight: FONT_SIZES.base * 1.5,
  },

  content: {
    gap: INDENTS.medium,
  },

  descriptionText: {
    color: '#fff',
    fontSize: FONT_SIZES.lg,
    lineHeight: FONT_SIZES.lg * 1.5,
  },

  emptyMessage: {
    color: '#9ca3af',
    fontSize: FONT_SIZES.base,
    textAlign: 'center',
  },

  label: {
    color: '#9ca3af',
    fontSize: FONT_SIZES.sm,
    letterSpacing: 1,
    marginBottom: INDENTS.lowest,
    textTransform: 'uppercase',
  },
})

export const DetailsOverlay = ({ audio, insetsTop, onClose, styles }: DetailsOverlayProps) => {
  const hasContent = Boolean(audio.description) || Boolean(audio.artist)

  return (
    <View style={[styles.descriptionContainer, { marginTop: insetsTop + HEADER_OFFSET }]}>
      <Pressable onPress={onClose} style={StyleSheet.absoluteFill} />
      <View style={styles.descriptionCard}>
        <ScrollView contentContainerStyle={localStyles.content}>
          {hasContent ? (
            <>
              {audio.description ? (
                <View>
                  <Text style={localStyles.label}>Описание</Text>
                  <Text style={localStyles.descriptionText}>{audio.description}</Text>
                </View>
              ) : null}
              {audio.artist ? (
                <View>
                  <Text style={localStyles.label}>Проповедник</Text>
                  <Text style={localStyles.authorText}>{audio.artist}</Text>
                </View>
              ) : null}
            </>
          ) : (
            <Text style={localStyles.emptyMessage}>Нет информации</Text>
          )}
        </ScrollView>
        <Pressable onPress={onClose} style={styles.descriptionCloseButton}>
          <Entypo name='cross' style={styles.descriptionCloseIcon} />
        </Pressable>
      </View>
    </View>
  )
}
