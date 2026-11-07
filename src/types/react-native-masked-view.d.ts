// @react-native-masked-view/masked-view 0.3.2 types its default export as a
// class intersected with the legacy `NativeMethods` namespace, which React 19
// JSX typings reject under RN 0.88 ("cannot be used as a JSX component").
// Re-declare the component with the props this app actually passes so the
// native edge-fade wrapper stays fully typed without a banned type assertion
// (same rationale as react-native-web.d.ts).
declare module '@react-native-masked-view/masked-view' {
  import { type ComponentType, type ReactElement } from 'react'
  import { type ViewProps } from 'react-native'

  interface MaskedViewProps extends ViewProps {
    androidRenderingMode?: 'hardware' | 'software'
    maskElement: ReactElement
  }

  const MaskedView: ComponentType<MaskedViewProps>
  export default MaskedView
}
