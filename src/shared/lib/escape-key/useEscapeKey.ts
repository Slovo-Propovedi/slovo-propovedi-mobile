import { useEffect, useRef } from 'react'
import { Platform } from 'react-native'
import { popEscapeLayer, pushEscapeLayer } from './escapeStack'

interface UseEscapeKeyOptions {
  enabled: boolean
  onEscape: (event: KeyboardEvent) => void
}

export const useEscapeKey = ({ enabled, onEscape }: UseEscapeKeyOptions): void => {
  const onEscapeRef = useRef(onEscape)

  useEffect(() => {
    onEscapeRef.current = onEscape
  })

  useEffect(() => {
    if (Platform.OS !== 'web' || !enabled) return

    const layerId = pushEscapeLayer(onEscapeRef)

    return () => {
      popEscapeLayer(layerId)
    }
  }, [enabled])
}
