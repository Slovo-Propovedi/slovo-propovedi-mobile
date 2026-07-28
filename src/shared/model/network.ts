import { action, atom } from '@reatom/framework'

export const isOnlineAtom = atom<boolean>(true, 'isOnlineAtom')
export const serverUnreachableAtom = atom<boolean>(false, 'serverUnreachableAtom')

// Internal — tracks whether toast was already shown for the current outage.
const serverErrorShownAtom = atom<boolean>(false, 'serverErrorShownAtom')

export const setOnlineStatus = action((ctx, online: boolean) => {
  isOnlineAtom(ctx, online)
}, 'setOnlineStatus')

// Called when an API call fails with a network error (server unreachable).
// Only shows toast once per outage episode: if already shown, does nothing.
// Once the server becomes reachable again, resets to allow the next outage.
export const reportServerUnreachable = action(ctx => {
  if (!ctx.get(isOnlineAtom)) return
  if (ctx.get(serverErrorShownAtom)) return

  serverErrorShownAtom(ctx, true)
  serverUnreachableAtom(ctx, true)
  // Auto-dismiss after 4 seconds
  setTimeout(() => {
    serverUnreachableAtom(ctx, false)
  }, 4000)
}, 'reportServerUnreachable')

// Called when an API call succeeds — clears server error state.
export const reportServerReachable = action(ctx => {
  serverErrorShownAtom(ctx, false)
  serverUnreachableAtom(ctx, false)
}, 'reportServerReachable')
