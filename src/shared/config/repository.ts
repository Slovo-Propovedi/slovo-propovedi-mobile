import { ENV } from './env'

// Where the app's own repository lives: the primary Forgejo and the Codeberg /
// GitHub mirrors. Built from the validated EXPO_PUBLIC_* coordinates (env.ts),
// so a host or org rename is a Forgejo org-variable change, not a code change.
// Codeberg runs Forgejo — same API shape as the primary; GitHub's hosts are fixed.
const repoName = ENV.mobileRepositoryName

const forgejoRepoUrl = (origin: string, org: string) => `${origin}/${org}/${repoName}`
const forgejoLatestReleaseApi = (origin: string, org: string) =>
  `${origin}/api/v1/repos/${org}/${repoName}/releases/latest`

export const PROJECT_REPOSITORY_URL = forgejoRepoUrl(ENV.repositoryUrl, ENV.repositoryOrg)

const CODEBERG_REPOSITORY_URL = forgejoRepoUrl(ENV.mirrorCodebergUrl, ENV.mirrorCodebergOrg)
const GITHUB_REPOSITORY_URL = `https://github.com/${ENV.mirrorGithubOrg}/${repoName}`

// Latest-release API endpoints, tried in this order by fetchLatestRelease.
export const LATEST_RELEASE_API_URLS = {
  codeberg: forgejoLatestReleaseApi(ENV.mirrorCodebergUrl, ENV.mirrorCodebergOrg),
  forgejo: forgejoLatestReleaseApi(ENV.repositoryUrl, ENV.repositoryOrg),
  github: `https://api.github.com/repos/${ENV.mirrorGithubOrg}/${repoName}/releases/latest`,
} as const

// Release-asset download prefixes of the three hosts — the update allowlist.
export const RELEASE_DOWNLOAD_URL_PREFIXES: readonly string[] = [
  `${PROJECT_REPOSITORY_URL}/releases/download/`,
  `${CODEBERG_REPOSITORY_URL}/releases/download/`,
  `${GITHUB_REPOSITORY_URL}/releases/download/`,
]
