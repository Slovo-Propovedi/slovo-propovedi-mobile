const path = require('path')
const { getDefaultConfig } = require('expo/metro-config')

// Expo defaults; only maxWorkers is conditionally overridden for CI.
// See .forgejo/workflows/release.yml (Build APK step) for the OOM context.
const config = getDefaultConfig(__dirname)

// Cap Metro transform workers in CI only (env is set by the release workflow).
// On the 4 GB runner each worker holds ASTs in RAM, and uncapped workers
// (cores - 1) plus the Gradle JVM exceed the host memory budget → SIGKILL (137).
// Locally no env var is set → Metro default behavior is unchanged.
if (process.env.CI_METRO_MAX_WORKERS) {
  config.maxWorkers = Number(process.env.CI_METRO_MAX_WORKERS)
}

// Web only: AsyncStorage is backed by IndexedDB instead of localStorage (async,
// no ~5 MB cap, one-time migration of the old localStorage data). Every
// `@react-native-async-storage/async-storage` import resolves to the adapter;
// native platforms keep the real package. See docs/features/web.md.
const WEB_ASYNC_STORAGE = path.resolve(__dirname, 'src/shared/lib/web-storage/webAsyncStorage.ts')
const resolveRequest = config.resolver.resolveRequest

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'web' && moduleName === '@react-native-async-storage/async-storage') {
    return { filePath: WEB_ASYNC_STORAGE, type: 'sourceFile' }
  }

  return (resolveRequest ?? context.resolveRequest)(context, moduleName, platform)
}

module.exports = config
