// Bumped on every clear: a write whose fetch started before the clear (an
// in-flight request of the signed-out session) is dropped instead of
// resurrecting the old session's data.
let epoch = 0

export const getSessionCacheEpoch = (): number => epoch

export const bumpSessionCacheEpoch = (): void => {
  epoch += 1
}
