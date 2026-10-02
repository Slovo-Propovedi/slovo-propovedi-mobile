import { type ConfigPlugin, withProjectBuildGradle } from '@expo/config-plugins'
import {
  MAVEN_ALLPROJECTS_REPOSITORIES,
  MAVEN_BUILDSCRIPT_REPOSITORIES,
  MAVEN_MIRROR_BLOCK,
  MAVEN_MIRROR_MARKER,
} from './mavenMirrorSnippets.ts'

const injectMirrorAfterAnchor = (contents: string, repositoriesAnchor: string): string => {
  if (!contents.includes(repositoriesAnchor))
    throw new Error(
      `withMavenCentralMirror: repositories block not found in android/build.gradle:\n${repositoriesAnchor}`,
    )

  return contents.replace(repositoriesAnchor, `${repositoriesAnchor}${MAVEN_MIRROR_BLOCK}`)
}

// Maven Central is throttled/unreliable from Russia, so the CI runner timed out
// downloading the react-android AAR. Aliyun proxies google()/mavenCentral() and
// is fast from RU; inject the mirrors ahead of google() in both repository
// blocks of android/build.gradle. Runs during `expo prebuild` so a wiped
// android/ tree is restored automatically.
export const withMavenCentralMirror: ConfigPlugin = config =>
  withProjectBuildGradle(config, gradleConfig => {
    const { contents } = gradleConfig.modResults

    if (contents.includes(MAVEN_MIRROR_MARKER)) return gradleConfig

    gradleConfig.modResults.contents = [
      MAVEN_BUILDSCRIPT_REPOSITORIES,
      MAVEN_ALLPROJECTS_REPOSITORIES,
    ].reduce(injectMirrorAfterAnchor, contents)

    return gradleConfig
  })
