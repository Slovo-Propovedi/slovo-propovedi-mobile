// TypeScript fallback - actual platform resolution handled by Metro/Webpack.
// MUST stay `.tsx`: Metro iterates `sourceExts` in order and `ts` comes before
// `tsx`, so an `index.ts` fallback would win on web before `index.web.tsx` is
// even considered (the native MaskedView fallback does not render children on
// web — the mini-player text disappeared entirely). Covered by index.web.test.
export { EdgeFadeContainer } from './index.native'
