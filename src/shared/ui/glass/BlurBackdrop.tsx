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
 * blurs on Android 12+. Registration happens once the target view is attached,
 * so a registered ref always points at a measured view; below Android 12 and off
 * Android the children render untouched (no extra view, current tint).
 * `disabled` stops publishing the target while keeping the subtree mounted: the
 * search overlay uses it to yield the backdrop to a detail page pushed on top
 * without losing the search session.
 * @param root0 - Backdrop props.
 * @param root0.children - The page content to expose as the blur backdrop.
 * @param root0.disabled - Keep the subtree mounted but drop its registration.
 * @param root0.routeKey - Route path the chrome resolves this page by.
 */
export const BlurBackdrop = ({
  children,
  disabled = false,
  routeKey,
}: PropsWithChildren<{ disabled?: boolean; routeKey: string }>) => {
  const targetRef = useRef<ComponentRef<typeof View> | null>(null)
  const hasBackdropBlur = supportsAndroidBackdropBlur()
  const isActive = hasBackdropBlur && !disabled

  useEffect(() => {
    if (!isActive) return

    // Re-register after the route becomes visible again: a `display: none`
    // parent does not relayout, so `onLayout` alone would never fire twice.
    if (targetRef.current) registerBlurTarget(routeKey, targetRef)

    return () => unregisterBlurTarget(routeKey, targetRef)
  }, [isActive, routeKey])

  if (!hasBackdropBlur) return <>{children}</>

  return (
    <BlurTargetView
      ref={targetRef}
      style={styles.target}
      onLayout={() => {
        if (isActive) registerBlurTarget(routeKey, targetRef)
      }}
    >
      {children}
    </BlurTargetView>
  )
}

const styles = StyleSheet.create({
  target: { flex: 1 },
})
