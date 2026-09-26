import fs from 'fs'
import path from 'path'
import { type ConfigPlugin, withDangerousMod } from '@expo/config-plugins'

const CANONICAL_KEYSTORE_FILENAME = 'debug.keystore'
const GENERATED_KEYSTORE_RELATIVE_PATH = path.join('app', 'debug.keystore')

const MISSING_CANONICAL_ERROR = (canonicalPath: string): string =>
  `withDebugKeystore: canonical debug keystore not found at ${canonicalPath}. ` +
  'It must live at the repo root (outside android/) so `expo prebuild --clean` ' +
  'cannot rotate the debug signing key. Restore it from git instead of letting Expo regenerate it.'

// `expo prebuild --clean` wipes android/ and regenerates a fresh debug.keystore,
// which rotates the debug signing key. A rotated key makes Expo CLI uninstall
// whatever debug build is already on the device (INSTALL_FAILED_UPDATE_INCOMPATIBLE),
// taking the other flavor down with it. The canonical key therefore lives at the
// repo root — outside the generated tree — and this mod copies it back on every
// prebuild. The keystore is a public debug key (the same one the RN template
// ships), so tracking it in git is fine. Blast radius is wider than debug: android/app/build.gradle
// signs the release build with this same debug signingConfig, so a deliberate rotation
// force-uninstalls BOTH dev and prod installs (debug AND release) and invalidates the
// assetlinks.json fingerprint chain.
//
// Idempotent: writes only when the generated copy differs from the canonical one.
// Fails loudly when the canonical file is missing rather than letting Expo silently
// regenerate a new key — a silent rotation is exactly the bug this prevents.
export const withDebugKeystore: ConfigPlugin = config =>
  withDangerousMod(config, [
    'android',
    dangerousConfig => {
      const { platformProjectRoot, projectRoot } = dangerousConfig.modRequest
      const canonicalPath = path.join(projectRoot, CANONICAL_KEYSTORE_FILENAME)

      if (!fs.existsSync(canonicalPath)) throw new Error(MISSING_CANONICAL_ERROR(canonicalPath))

      const generatedPath = path.join(platformProjectRoot, GENERATED_KEYSTORE_RELATIVE_PATH)
      const canonicalBytes = fs.readFileSync(canonicalPath)
      const generatedBytes = fs.existsSync(generatedPath) ? fs.readFileSync(generatedPath) : null

      if (generatedBytes?.equals(canonicalBytes)) return dangerousConfig

      fs.mkdirSync(path.dirname(generatedPath), { recursive: true })
      fs.writeFileSync(generatedPath, canonicalBytes)

      return dangerousConfig
    },
  ])
