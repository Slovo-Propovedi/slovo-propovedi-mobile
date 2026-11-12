// On web there is no native share sheet: the Web Share API (navigator.share) is
// only available in supporting browsers, so gate the "Send link" action on it.
// `navigator` is absent during prerender/static export, so guard it before probing.
export const isShareSupported =
  typeof navigator !== 'undefined' && typeof navigator.share === 'function'
