import { existsSync } from 'node:fs'
import { type ExpoConfig } from 'expo/config'

// --- Self-hosted OTA (expo-updates → xprem, Expo Updates protocol v1) ---
// Silent JS/assets updates ship from our own server; native changes still go
// through the APK release. Deployment values (server URL, xprem app id, channel,
// branch) come ONLY from env vars — see `.env.example` for local builds and the
// Forgejo org/repo `vars` for CI (.forgejo/workflows/release.yml). This file runs
// in Node while Expo evaluates the config, so the values are baked into the build
// manifest rather than bundled into the app JS.
//
// All-or-nothing contract: OTA switches on only when ALL four vars are set. A
// build without deployment env (F-Droid buildbot, arbitrary local build) gets
// `updates.enabled: false` and never self-updates — safer than shipping a bundle
// that points at a wrong or unreachable server.
interface OtaEnv {
  appId: string
  branchName: string
  channelName: string
  url: string
}

const readOtaEnv = (): null | OtaEnv => {
  // FULL manifest URL of the xprem server, including `/manifest`: expo-updates
  // requests this value verbatim and appends nothing. A bare host makes the app
  // fetch `/`, where the server answers 404.
  const url = process.env.EXPO_PUBLIC_OTA_URL?.trim()
  const appId = process.env.EXPO_PUBLIC_XPREM_APP_ID?.trim()
  const channelName = process.env.EXPO_PUBLIC_XPREM_CHANNEL_NAME?.trim()
  const branchName = process.env.EXPO_PUBLIC_XPREM_BRANCH_NAME?.trim()

  if (!url || !appId || !channelName || !branchName) return null

  return { appId, branchName, channelName, url }
}

type CodeSigningConfig = Pick<UpdatesConfig, 'codeSigningCertificate' | 'codeSigningMetadata'>
type UpdatesConfig = NonNullable<ExpoConfig['updates']>

// Code signing switches on by itself once the xprem certificate lands in the repo;
// until then updates are accepted unsigned (see docs/features/updates.md).
const CODE_SIGNING_CERT_PATH = './certs/xprem-certificate.pem'

const readCodeSigning = (): CodeSigningConfig | null => {
  if (!existsSync(CODE_SIGNING_CERT_PATH)) return null

  return {
    codeSigningCertificate: CODE_SIGNING_CERT_PATH,
    codeSigningMetadata: { alg: 'rsa-v1_5-sha256', keyid: 'main' },
  }
}

// OTA gate: a bundle is delivered only to builds whose runtime version matches the
// published manifest. Hardcoded literal ON PURPOSE (not pkg.version): bump it
// whenever native code, the Expo SDK or config plugins change, so a JS-only update
// never lands on an incompatible native build. Versioning, not deployment config —
// it is deliberately not env-driven.
const RUNTIME_VERSION = '0.31.0'

const buildUpdates = (env: null | OtaEnv): UpdatesConfig => {
  if (!env) return { enabled: false }

  const codeSigning = readCodeSigning()

  // ON_LOAD + fallbackToCacheTimeout 0: check the manifest on every cold start,
  // but never wait for the download — a fetched bundle applies on the next launch.
  return {
    checkAutomatically: 'ON_LOAD',
    fallbackToCacheTimeout: 0,
    requestHeaders: {
      'expo-app-id': env.appId,
      'expo-channel-name': env.channelName,
      'xprem-branch': env.branchName,
    },
    url: env.url,
    ...(codeSigning ?? {}),
  }
}

type OtaConfig = Pick<ExpoConfig, 'runtimeVersion' | 'updates'>

export const OTA_CONFIG: OtaConfig = {
  runtimeVersion: RUNTIME_VERSION,
  updates: buildUpdates(readOtaEnv()),
}
