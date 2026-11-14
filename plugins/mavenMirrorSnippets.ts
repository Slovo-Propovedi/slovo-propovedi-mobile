// Verbatim Gradle snippets injected by withMavenCentralMirror. Kept in their own
// module because gradleSnippets.ts already sits at the 130-line ESLint ceiling.

// Maven Central is throttled from Russia: the CI runner timed out downloading the
// react-android AAR. Aliyun mirrors both google() and Maven Central and is fast
// from RU, so these repositories are injected ahead of google() — unless the env
// var MAVEN_ALIYUN_MIRROR=false disables the mirror (GitHub-hosted runners, where
// Aliyun 502s from US IPs).
export const MAVEN_MIRROR_MARKER = 'withMavenCentralMirror'

export const MAVEN_MIRROR_BLOCK = `    // withMavenCentralMirror: Aliyun proxies google()/mavenCentral(), fast from RU.
    // MAVEN_ALIYUN_MIRROR=false disables it (GitHub-hosted runners: Aliyun 502s
    // from US IPs; google()/mavenCentral() serve everything directly).
    if (System.getenv('MAVEN_ALIYUN_MIRROR') != 'false') {
      maven { url 'https://maven.aliyun.com/repository/google' }
      maven { url 'https://maven.aliyun.com/repository/central' }
    }
`

// Anchors end right after the opening `repositories {` line, so the mirror block
// lands immediately before the first `google()` in each of the two blocks.
export const MAVEN_BUILDSCRIPT_REPOSITORIES = `buildscript {
  repositories {
`

export const MAVEN_ALLPROJECTS_REPOSITORIES = `allprojects {
  repositories {
`
