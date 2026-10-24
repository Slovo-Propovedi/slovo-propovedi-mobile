// APK archives are published as `slovo-propovedi-v<version>.zip`; the web
// export is `slovo-propovedi-web-v<version>.zip`. A digit right after `v`
// (anchored on both ends) selects the APK archive even on a JS-only release,
// where the web zip is the only `.zip` asset attached. Same shape as the
// landing script regex (^slovo-propovedi-v[0-9][^/]*\.zip$).
const APK_ZIP_ASSET_NAME = /^slovo-propovedi-v[0-9][^/]*\.zip$/

export const isApkZipAssetName = (name: string): boolean => APK_ZIP_ASSET_NAME.test(name)
