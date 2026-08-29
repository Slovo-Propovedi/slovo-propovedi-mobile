import { action, atom } from '@reatom/framework'

export interface TrackBoundaryNotice {
  at: number
  boundary: 'first' | 'last'
}

export const trackBoundaryNoticeAtom = atom<null | TrackBoundaryNotice>(
  null,
  'trackBoundaryNoticeAtom',
)

export const setTrackBoundaryNoticeAction = action(
  (ctx, boundary: TrackBoundaryNotice['boundary']) => {
    trackBoundaryNoticeAtom(ctx, { at: Date.now(), boundary })
  },
  'setTrackBoundaryNotice',
)
