import fs from 'fs'
import path from 'path'
import {
  type ConfigPlugin,
  withDangerousMod,
  withGradleProperties,
  withProjectBuildGradle,
} from '@expo/config-plugins'
import {
  EXPO_ROOT_PROJECT_ANCHOR,
  GRADLE_JVMARGS_KEY,
  GRADLE_JVMARGS_VALUE,
  KOTLIN_GITIGNORE_LINE,
  ROOT_SUBPROJECTS_BLOCK,
} from './gradleSnippets.ts'

const withSubprojectsLint: ConfigPlugin = config =>
  withProjectBuildGradle(config, gradleConfig => {
    const { contents } = gradleConfig.modResults
    const alreadyPatched = contents.includes('lintVital')

    if (!alreadyPatched) {
      if (!contents.includes(EXPO_ROOT_PROJECT_ANCHOR))
        throw new Error(
          'withAndroidBuildMaintenance: expo-root-project marker not found in android/build.gradle',
        )

      gradleConfig.modResults.contents = contents.replace(
        EXPO_ROOT_PROJECT_ANCHOR,
        `${ROOT_SUBPROJECTS_BLOCK}${EXPO_ROOT_PROJECT_ANCHOR}`,
      )
    }

    return gradleConfig
  })

const withJvmArgs: ConfigPlugin = config =>
  withGradleProperties(config, gradleConfig => {
    const isJvmArgs = (item: (typeof gradleConfig.modResults)[number]): boolean =>
      item.type === 'property' && item.key === GRADLE_JVMARGS_KEY

    gradleConfig.modResults = gradleConfig.modResults.some(isJvmArgs)
      ? gradleConfig.modResults.map(item =>
          isJvmArgs(item) ? { ...item, value: GRADLE_JVMARGS_VALUE } : item,
        )
      : [
          ...gradleConfig.modResults,
          { key: GRADLE_JVMARGS_KEY, type: 'property', value: GRADLE_JVMARGS_VALUE },
        ]

    return gradleConfig
  })

const ensureGitignoreLine = (filePath: string, line: string): void => {
  const contents = fs.readFileSync(filePath, 'utf8')
  const hasLine = contents.split('\n').some(existingLine => existingLine.trim() === line)

  if (hasLine) return

  const separator = contents.endsWith('\n') ? '' : '\n'
  fs.writeFileSync(filePath, `${contents}${separator}${line}\n`)
}

const withKotlinGitignore: ConfigPlugin = config =>
  withDangerousMod(config, [
    'android',
    dangerousConfig => {
      const gitignorePath = path.join(dangerousConfig.modRequest.platformProjectRoot, '.gitignore')

      ensureGitignoreLine(gitignorePath, KOTLIN_GITIGNORE_LINE)

      return dangerousConfig
    },
  ])

// Restores the Gradle lint/metaspace hardening (root subprojects block, JVM
// args) and the Kotlin build-artifact ignore rule that `expo prebuild --clean`
// strips from the committed android/ tree.
export const withAndroidBuildMaintenance: ConfigPlugin = config =>
  withKotlinGitignore(withJvmArgs(withSubprojectsLint(config)))
