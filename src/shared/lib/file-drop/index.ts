// Платформенное разрешение: Metro/Webpack подставляют `useFileDrop.web.ts` на
// web и `useFileDrop.ts` на native.
export { type AdminFileKind, detectFileKind } from './fileKinds'
export { predictDropKinds } from './predictDropKinds'
export { useFileDrop } from './useFileDrop'
