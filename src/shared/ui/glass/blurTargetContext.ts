import { createContext, useContext } from 'react'
import { type BlurTargetRef } from './blurTargets'

/**
 * Page backdrop currently mounted under the floating bottom chrome, published
 * once by `BlurTargetProvider`. Glass surfaces read it instead of each
 * host resolving the route itself, so every island blurs the same content.
 */
export const BlurTargetContext = createContext<BlurTargetRef | null>(null)

export const useGlassBlurTarget = () => useContext(BlurTargetContext)
