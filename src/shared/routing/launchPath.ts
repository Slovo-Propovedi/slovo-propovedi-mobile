const SCHEME_SEPARATOR = '://'
const HOST_BASED_SCHEMES = ['http', 'https']
const FALLBACK_LANDING_ROUTES = ['/', '/listen'] as const
const DEV_CLIENT_PATH_SEGMENT = '/expo-development-client'

/**
 * Normalizes the path of a custom-scheme URL: `app:///foo` and `app://foo`
 * both yield `/foo`; a scheme with nothing after it yields null.
 * @param afterScheme - Everything the URL carries after `://`.
 * @returns Router path with exactly one leading slash, or null when empty.
 */
const normalizeCustomSchemePath = (afterScheme: string): null | string => {
  const segments = afterScheme.replace(/^\/+/, '')
  if (segments === '') return null

  return `/${segments}`
}

/**
 * Extracts the router path and query string from a launch URL.
 *
 * Parsing starts at `://` instead of using `new URL`, because custom-scheme
 * URLs are not treated as special by every JS engine. Host-based schemes strip
 * the authority (`https://host/foo` -> `/foo`); custom schemes keep every
 * segment as path (`app://foo/bar` -> `/foo/bar`). The path is returned
 * verbatim (no decoding, no lowercasing) since expo-router decodes it itself.
 * @param url - Raw launch URL received from the native layer.
 * @returns Router path with its query string, or null when there is no path.
 */
export const extractLaunchPath = (url: string): null | string => {
  const trimmedUrl = url.trim()
  if (trimmedUrl === '') return null

  const schemeSeparatorIndex = trimmedUrl.indexOf(SCHEME_SEPARATOR)
  if (schemeSeparatorIndex === -1) return null

  const scheme = trimmedUrl.slice(0, schemeSeparatorIndex).toLowerCase()
  const afterScheme = trimmedUrl.slice(schemeSeparatorIndex + SCHEME_SEPARATOR.length)
  if (afterScheme === '') return null

  const isHostBased = HOST_BASED_SCHEMES.includes(scheme)
  if (isHostBased && !afterScheme.includes('/')) return null

  const pathWithQuery = isHostBased
    ? afterScheme.slice(afterScheme.indexOf('/'))
    : normalizeCustomSchemePath(afterScheme)
  if (pathWithQuery === null) return null

  const hashIndex = pathWithQuery.indexOf('#')
  if (hashIndex === -1) return pathWithQuery

  return pathWithQuery.slice(0, hashIndex)
}

/**
 * Decides whether a cold-start launch path should be replayed onto the current route.
 *
 * Recovery only fires while the app still shows a redirect fallback route, so a
 * link that expo-router already handled or a manual navigation is never hijacked.
 * Expo dev client launch URLs (`/expo-development-client/?url=...`) are not app
 * routes, so they must never be replayed.
 * @param currentPathname - Route the app currently shows.
 * @param launchPath - Path parsed from the launch URL, or null.
 * @returns True when the launch path must be pushed onto the router.
 */
export const shouldAttemptRecovery = (
  currentPathname: string,
  launchPath: null | string,
): boolean => {
  if (launchPath === null) return false
  if (launchPath.startsWith(DEV_CLIENT_PATH_SEGMENT)) return false
  if (launchPath === currentPathname) return false

  return FALLBACK_LANDING_ROUTES.some(route => route === currentPathname)
}
