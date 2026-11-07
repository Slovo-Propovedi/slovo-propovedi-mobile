import { ENV } from './env'

// Where the app's own repository lives: the primary Forgejo and the Codeberg /
// GitHub mirrors. Built from the validated EXPO_PUBLIC_* coordinates (env.ts),
// so a host or org rename is a Forgejo org-variable change, not a code change.
// Codeberg runs Forgejo — same API shape as the primary; GitHub's hosts are fixed.
const repoName = ENV.mobileRepositoryName

const forgejoRepoUrl = (origin: string, org: string) => `${origin}/${org}/${repoName}`
const forgejoLatestReleaseApi = (origin: string, org: string) =>
  `${origin}/api/v1/repos/${org}/${repoName}/releases/latest`

// A mirror URL carries its owner as the single path segment: origin and owner
// are parsed out of the ONE variable at the boundary, so a host or owner
// rename stays a Forgejo org-variable change. Guards here keep a hand-edited
// (schema-bypassing) value from shipping a prefix-widening URL.
const parseMirrorUrl = (url: string) => {
  const parsed = new URL(url)
  const owner = parsed.pathname.replace(/^\/+/, '').replace(/\/+$/, '')
  if (!owner) throw new Error(`Invalid mirror URL (no owner path): ${url}`)
  return { origin: parsed.origin, owner }
}

// GitHub's API/hosts are fixed (api.github.com) — only the owner comes from
// the mirror URL.
const codebergMirror = parseMirrorUrl(ENV.mirrorCodebergUrl)
const githubMirror = parseMirrorUrl(ENV.mirrorGithubUrl)

export const PROJECT_REPOSITORY_URL = forgejoRepoUrl(ENV.repositoryUrl, ENV.repositoryOwner)

const CODEBERG_REPOSITORY_URL = `${codebergMirror.origin}/${codebergMirror.owner}/${repoName}`
const GITHUB_REPOSITORY_URL = `${githubMirror.origin}/${githubMirror.owner}/${repoName}`

// Latest-release API endpoints, tried in this order by fetchLatestRelease.
export const LATEST_RELEASE_API_URLS = {
  codeberg: forgejoLatestReleaseApi(codebergMirror.origin, codebergMirror.owner),
  forgejo: forgejoLatestReleaseApi(ENV.repositoryUrl, ENV.repositoryOwner),
  github: `https://api.github.com/repos/${githubMirror.owner}/${repoName}/releases/latest`,
} as const

// Release-asset download prefixes of the three hosts — the update allowlist.
export const RELEASE_DOWNLOAD_URL_PREFIXES: readonly string[] = [
  `${PROJECT_REPOSITORY_URL}/releases/download/`,
  `${CODEBERG_REPOSITORY_URL}/releases/download/`,
  `${GITHUB_REPOSITORY_URL}/releases/download/`,
]
