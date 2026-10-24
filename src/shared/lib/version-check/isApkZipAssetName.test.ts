import { isApkZipAssetName } from './isApkZipAssetName'

describe('isApkZipAssetName', () => {
  test('accepts the APK archive published by release.yml', () => {
    expect(isApkZipAssetName('slovo-propovedi-v0.29.1.zip')).toBe(true)
  })

  test('accepts older two-part versions', () => {
    expect(isApkZipAssetName('slovo-propovedi-v12.4.zip')).toBe(true)
  })

  test('rejects the web export asset', () => {
    expect(isApkZipAssetName('slovo-propovedi-web-v0.29.1.zip')).toBe(false)
  })

  test('rejects names where the version does not start with a digit', () => {
    expect(isApkZipAssetName('slovo-propovedi-vnext.zip')).toBe(false)
  })

  test('rejects lookalikes that are not anchored', () => {
    expect(isApkZipAssetName('slovo-propovedi-v0.29.1.zip.sig')).toBe(false)
    expect(isApkZipAssetName('prefix-slovo-propovedi-v0.29.1.zip')).toBe(false)
  })

  test('rejects other release assets', () => {
    expect(isApkZipAssetName('SHA256SUMS.txt')).toBe(false)
    expect(isApkZipAssetName('slovo-propovedi-v0.29.1.apk')).toBe(false)
  })
})
