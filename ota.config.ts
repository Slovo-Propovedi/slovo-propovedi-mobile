import { existsSync } from 'node:fs'
import { type ExpoConfig } from 'expo/config'

// --- Self-hosted OTA (expo-updates → xprem, Expo Updates protocol v1) ---
// Silent JS/assets updates ship from our own server; native changes still go
// through the APK release. Header values must stay in sync with the xprem
// dashboard and with the `eoas publish` step in .forgejo/workflows/release.yml.
const XPREM_CHANNEL_NAME = 'production'
const XPREM_BRANCH_NAME = 'production'
// TODO(egoreast): replace with the real xprem app id after the dashboard bootstrap
// (see docs/features/updates.md → «OTA-обновления»)
const XPREM_APP_ID = 'CHANGE-ME-xprem-app-id'
// Code signing switches on by itself once the xprem certificate lands in the repo;
// until then updates are accepted unsigned (see docs/features/updates.md).
const CODE_SIGNING_CERT_PATH = './certs/xprem-certificate.pem'

// OTA gate: a bundle is delivered only to builds whose runtime version matches the
// published manifest. Hardcoded literal ON PURPOSE (not pkg.version): bump it
// whenever native code, the Expo SDK or config plugins change, so a JS-only update
// never lands on an incompatible native build.
const RUNTIME_VERSION = '0.29.0'

type OtaConfig = Pick<ExpoConfig, 'runtimeVersion' | 'updates'>

export const OTA_CONFIG: OtaConfig = {
  runtimeVersion: RUNTIME_VERSION,
  updates: {
    // ON_LOAD + fallbackToCacheTimeout 0: check the manifest on every cold start,
    // but never wait for the download — a fetched bundle applies on the next launch.
    checkAutomatically: 'ON_LOAD',
    fallbackToCacheTimeout: 0,
    requestHeaders: {
      'expo-app-id': XPREM_APP_ID,
      'expo-channel-name': XPREM_CHANNEL_NAME,
      'xprem-branch': XPREM_BRANCH_NAME,
    },
    url: 'https://ota.slovo-propovedi.ru/api/manifest',
    // Certificate lands later during the xprem bootstrap — until then the keys are
    // absent and updates are accepted unsigned.
    ...(existsSync(CODE_SIGNING_CERT_PATH)
      ? {
          codeSigningCertificate: CODE_SIGNING_CERT_PATH,
          codeSigningMetadata: { alg: 'rsa-v1_5-sha256', keyid: 'main' },
        }
      : {}),
  },
}
