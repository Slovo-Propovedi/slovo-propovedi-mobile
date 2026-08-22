import { Asset } from 'expo-asset'

// eslint-disable-next-line @typescript-eslint/no-require-imports -- Metro bundler requires require() for static assets
const appIconAsset = Asset.fromModule(require('../../../assets/fallback-artwork.png'))

export const hasUriProtocol = (value: null | string | undefined): value is string =>
  !!value && /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(value)

export let APP_ICON_URI = appIconAsset.uri

let localAppIconUri: null | string = null

export const getLocalAppIconUri = (): null | string => localAppIconUri

void appIconAsset
  .downloadAsync()
  .then(asset => {
    const localUri = hasUriProtocol(asset.localUri) ? asset.localUri : null
    localAppIconUri = localUri
    if (localUri) APP_ICON_URI = localUri
  })
  .catch(error => console.warn('app-icon: fallback artwork download failed:', error))
