import { BlurTargetView } from 'expo-blur'
import { type ComponentRef, type PropsWithChildren, useEffect, useRef } from 'react'
import { StyleSheet, type View } from 'react-native'
import {
  registerBlurTarget,
  supportsAndroidBackdropBlur,
  unregisterBlurTarget,
} from './blurTargets'

/**
 * Wraps a page's content in the native target that the floating bottom chrome
 * blurs on Android 12+. Registration happens on the first layout, so a target
 * is only offered once it is attached and measured; below Android 12 and off
 * Android the children render untouched (no extra view, current tint).
 * @param root0 - Backdrop props.
 * @param root0.children - The page content to expose as the blur backdrop.
 * @param root0.routeKey - Route path the chrome resolves this page by.
 */
export const BlurBackdrop = ({ children, routeKey }: PropsWithChildren<{ routeKey: string }>) => {
  const targetRef = useRef<ComponentRef<typeof View> | null>(null)
  const hasBackdropBlur = supportsAndroidBackdropBlur()

  useEffect(() => {
    if (!hasBackdropBlur) return

    return () => unregisterBlurTarget(routeKey, targetRef)
  }, [hasBackdropBlur, routeKey])

  if (!hasBackdropBlur) return <>{children}</>

  return (
    <BlurTargetView
      ref={targetRef}
      style={styles.target}
      onLayout={() => registerBlurTarget(routeKey, targetRef)}
    >
      {children}
    </BlurTargetView>
  )
}

const styles = StyleSheet.create({
  target: { flex: 1 },
})
