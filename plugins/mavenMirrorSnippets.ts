// Verbatim Gradle snippets injected by withMavenCentralMirror. Kept in their own
// module because gradleSnippets.ts already sits at the 130-line ESLint ceiling.

// Maven Central is throttled from Russia: the CI runner timed out downloading the
// react-android AAR. Aliyun mirrors both google() and Maven Central and is fast
// from RU, so these repositories are injected ahead of google().
export const MAVEN_MIRROR_MARKER = 'withMavenCentralMirror'

export const MAVEN_MIRROR_BLOCK = `    // withMavenCentralMirror: Aliyun proxies google()/mavenCentral(), fast from RU
    maven { url 'https://maven.aliyun.com/repository/google' }
    maven { url 'https://maven.aliyun.com/repository/central' }
`

// Anchors end right after the opening `repositories {` line, so the mirror block
// lands immediately before the first `google()` in each of the two blocks.
export const MAVEN_BUILDSCRIPT_REPOSITORIES = `buildscript {
  repositories {
`

export const MAVEN_ALLPROJECTS_REPOSITORIES = `allprojects {
  repositories {
`
