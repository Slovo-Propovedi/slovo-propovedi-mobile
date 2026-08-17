import { Asset } from 'expo-asset'

// eslint-disable-next-line @typescript-eslint/no-require-imports -- Metro bundler requires require() for static assets
const appIconAsset = Asset.fromModule(require('../../../assets/fallback-artwork.png'))

export const APP_ICON_URI = appIconAsset.uri

let localAppIconUri: null | string = null

export const getLocalAppIconUri = (): null | string => localAppIconUri

void appIconAsset
  .downloadAsync()
  .then(asset => {
    localAppIconUri = asset.localUri ?? null
  })
  .catch(error => console.warn('app-icon: fallback artwork download failed:', error))
