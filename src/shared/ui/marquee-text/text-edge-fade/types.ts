import { type ReactNode } from 'react'
import { type LayoutChangeEvent, type StyleProp, type ViewStyle } from 'react-native'

export interface EdgeFadeContainerProps {
  children: ReactNode
  /** Callback ref to the container node (web DOM guards attach listeners to it). */
  containerRef?: (instance: unknown) => void
  /** Whether the consumer opted into the edge treatment at all (static per call site). */
  enabled: boolean
  /** Whether the text currently overflows and the trailing edge must fade. */
  fading: boolean
  onLayout?: (event: LayoutChangeEvent) => void
  style?: StyleProp<ViewStyle>
  testID?: string
}
