import { Entypo } from '@expo/vector-icons'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import type { createStyles } from '../ExpandablePlayer/styles'
import type { AudioPlayerData } from 'entities/player'

interface DescriptionOverlayProps {
  audio: AudioPlayerData
  insetsTop: number
  onClose: () => void
  styles: ReturnType<typeof createStyles>
}

export const DescriptionOverlay = ({
  audio,
  insetsTop,
  onClose,
  styles,
}: DescriptionOverlayProps) => (
  <View style={[styles.descriptionContainer, { marginTop: insetsTop + 60 }]}>
    <Pressable onPress={onClose} style={StyleSheet.absoluteFill} />
    <View style={styles.descriptionCard}>
      <ScrollView>
        <Text style={styles.descriptionText}>{audio.description}</Text>
      </ScrollView>
      <Pressable onPress={onClose} style={styles.descriptionCloseButton}>
        <Entypo name='cross' style={styles.descriptionCloseIcon} />
      </Pressable>
    </View>
  </View>
)
