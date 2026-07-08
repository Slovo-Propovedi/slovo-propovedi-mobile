import { action, atom } from '@reatom/framework'

export const isOnlineAtom = atom<boolean>(true, 'isOnlineAtom')
export const serverUnreachableAtom = atom<boolean>(false, 'serverUnreachableAtom')

export const setOnlineStatus = action((ctx, online: boolean) => {
  isOnlineAtom(ctx, online)
}, 'setOnlineStatus')

// Called when an API call fails with a network error (server unreachable).
// Only shows toast if device is online (otherwise offline banner covers it).
export const reportServerUnreachable = action(ctx => {
  if (!ctx.get(isOnlineAtom)) return

  serverUnreachableAtom(ctx, true)
  // Auto-dismiss after 4 seconds
  setTimeout(() => {
    serverUnreachableAtom(ctx, false)
  }, 4000)
}, 'reportServerUnreachable')

// Called when an API call succeeds — clears server error state.
export const reportServerReachable = action(ctx => {
  serverUnreachableAtom(ctx, false)
}, 'reportServerReachable')
