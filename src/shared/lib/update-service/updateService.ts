import * as ApkInstaller from 'apk-installer'
import { Directory, File, Paths } from 'expo-file-system'
import * as IntentLauncher from 'expo-intent-launcher'
import { Platform } from 'react-native'
import { listContents, unzip } from 'react-native-zip-archive'

const APK_SAFE_NAME = 'update.apk'
const APK_EXTENSION = '.apk'
const APK_MIME_TYPE = 'application/vnd.android.package-archive'
const UPDATES_DIR_NAME = 'updates'
const ZIP_FILE_NAME = 'slovo-propovedi-update.zip'
const HTTPS_PREFIX = 'https://'

// FLAG_ACTIVITY_NEW_TASK (0x10000000) | FLAG_GRANT_READ_URI_PERMISSION (0x00000001)
const INSTALL_INTENT_FLAGS = 0x10000001
const VIEW_ACTION = 'android.intent.action.VIEW'

const assertAndroid = (operationName: string): void => {
  if (Platform.OS !== 'android')
    throw new Error(`[updateService] ${operationName} is only supported on Android`)
}

const getUpdatesDirectory = (): Directory => new Directory(Paths.cache, UPDATES_DIR_NAME)

const ensureUpdatesDirectoryExists = (): Directory => {
  const updatesDir = getUpdatesDirectory()
  if (!updatesDir.exists) updatesDir.create({ intermediates: true })
  return updatesDir
}

export const downloadUpdateZip = async (
  url: string,
  onProgress?: (progressPercent: number) => void,
): Promise<string> => {
  assertAndroid('downloadUpdateZip')
  if (!url.startsWith(HTTPS_PREFIX))
    throw new Error(`[updateService] Download URL must be an https URL, got: ${url}`)

  const updatesDir = ensureUpdatesDirectoryExists()
  const zipFile = new File(updatesDir, ZIP_FILE_NAME)
  if (zipFile.exists) zipFile.delete()

  const task = File.createDownloadTask(url, zipFile, {
    onProgress: onProgress
      ? ({ bytesWritten, totalBytes }) => {
          if (totalBytes <= 0) return
          onProgress(Math.round((bytesWritten / totalBytes) * 100))
        }
      : undefined,
  })

  const downloadedFile = await task.downloadAsync()
  if (!downloadedFile) throw new Error(`[updateService] Download failed or was cancelled: ${url}`)
  return downloadedFile.uri
}

const findApkEntryPath = async (zipPath: string): Promise<string> => {
  const entries = await listContents(zipPath)
  const apkEntry = entries.find(entry => !entry.isDirectory && entry.path.endsWith(APK_EXTENSION))
  if (!apkEntry) throw new Error('[updateService] No .apk file found inside the update archive')
  return apkEntry.path
}

export const extractApkFromZip = async (zipPath: string): Promise<string> => {
  assertAndroid('extractApkFromZip')

  const updatesDir = ensureUpdatesDirectoryExists()
  const apkEntryPath = await findApkEntryPath(zipPath)

  // The APK inside the archive is named "Slovo.Propovedi v{VERSION}.apk" (with spaces),
  // so it is extracted selectively and renamed to a shell-safe filename afterwards.
  await unzip(zipPath, updatesDir.uri, 'UTF-8', [apkEntryPath])

  const extractedFileName = apkEntryPath.split('/').pop() ?? ''
  const extractedApk = new File(updatesDir, extractedFileName)
  if (!extractedApk.exists)
    throw new Error(`[updateService] Extracted APK is missing at: ${extractedApk.uri}`)

  const safeApk = new File(updatesDir, APK_SAFE_NAME)
  if (safeApk.exists) safeApk.delete()
  extractedApk.rename(APK_SAFE_NAME)

  return safeApk.uri
}

export const apkFileExists = (apkPath: string): boolean => new File(apkPath).exists

export const installApk = async (apkPath: string): Promise<void> => {
  assertAndroid('installApk')

  const apkFile = new File(apkPath)
  if (!apkFile.exists) throw new Error(`[updateService] APK file not found at: ${apkPath}`)

  if (ApkInstaller.isApkInstallerAvailable()) {
    await ApkInstaller.installApk(apkPath)
    return
  }

  await IntentLauncher.startActivityAsync(VIEW_ACTION, {
    data: apkFile.contentUri,
    flags: INSTALL_INTENT_FLAGS,
    type: APK_MIME_TYPE,
  })
}

export const canRequestPackageInstalls = async (): Promise<boolean> => {
  if (!ApkInstaller.isApkInstallerAvailable()) return true
  return ApkInstaller.canRequestPackageInstalls()
}

export const openInstallPermissionSettings = async (): Promise<void> => {
  if (!ApkInstaller.isApkInstallerAvailable()) {
    console.warn('[updateService] openInstallPermissionSettings is unavailable')
    return
  }
  await ApkInstaller.openInstallPermissionSettings()
}

export const cleanupUpdateFiles = async (): Promise<void> => {
  if (Platform.OS !== 'android') return

  try {
    const updatesDir = getUpdatesDirectory()
    if (updatesDir.exists) updatesDir.delete()
  } catch (error) {
    console.warn('[updateService] Cleanup failed:', error)
  }
}
