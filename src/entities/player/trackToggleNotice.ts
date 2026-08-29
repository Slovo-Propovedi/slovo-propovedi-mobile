import { action, atom } from '@reatom/framework'

export type TrackToggleNotice =
  | { at: number; boundary: 'first' | 'last'; kind: 'boundary' }
  | { at: number; kind: 'restart' }
  | { at: number; kind: 'wrap'; to: 'first' | 'last' }

export const trackToggleNoticeAtom = atom<null | TrackToggleNotice>(null, 'trackToggleNoticeAtom')

export const setTrackToggleNoticeAction = action((ctx, notice: TrackToggleNotice) => {
  trackToggleNoticeAtom(ctx, notice)
}, 'setTrackToggleNotice')
