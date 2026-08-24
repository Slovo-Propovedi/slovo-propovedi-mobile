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

module.exports = config
