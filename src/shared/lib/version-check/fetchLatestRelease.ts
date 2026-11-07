/* eslint-disable camelcase -- GitHub/Forgejo release API fields are snake_case */
import axios from 'axios'
import z from 'zod'
import { LATEST_RELEASE_API_URLS } from '../../config/repository'
import { isApkZipAssetName } from './isApkZipAssetName'
import { type LatestReleaseInfo } from './types'

// Built from the repository coordinates (EXPO_PUBLIC_*, validated in env.ts).
const {
  codeberg: CODEBERG_API_URL,
  forgejo: FORGEJO_API_URL,
  github: GITHUB_API_URL,
} = LATEST_RELEASE_API_URLS
const REQUEST_TIMEOUT = 10000
const CHECKSUM_ASSET_NAME = 'SHA256SUMS.txt'

const releaseAssetSchema = z.object({
  browser_download_url: z.string(),
  name: z.string(),
})

const rawReleaseSchema = z.object({
  assets: z.array(releaseAssetSchema),
  body: z.string(),
  draft: z.boolean(),
  html_url: z.string(),
  name: z.string(),
  prerelease: z.boolean(),
  published_at: z.string(),
  tag_name: z.string(),
})

const parseRelease = (data: unknown): LatestReleaseInfo | null => {
  const parsed = rawReleaseSchema.safeParse(data)
  if (!parsed.success) {
    console.error('[version-check] Invalid release response:', parsed.error)
    return null
  }

  const release = parsed.data
  if (release.prerelease) return null
  if (release.tag_name.includes('-')) return null

  // Anchored on the APK naming: a JS-only release also carries the web export
  // (`slovo-propovedi-web-v<version>.zip`), which is not an app update.
  const zipAsset = release.assets.find(asset => isApkZipAssetName(asset.name))
  const checksumAsset = release.assets.find(
    asset => asset.name.toLowerCase() === CHECKSUM_ASSET_NAME.toLowerCase(),
  )

  return {
    body: release.body.replace(/\r\n/g, '\n'),
    htmlUrl: release.html_url,
    name: release.name,
    publishedAt: release.published_at,
    sha256SumsDownloadUrl: checksumAsset?.browser_download_url ?? null,
    tagName: release.tag_name,
    version: release.tag_name.replace(/^v/, ''),
    zipDownloadUrl: zipAsset?.browser_download_url ?? null,
  }
}

const fetchFromForgejo = async (): Promise<LatestReleaseInfo | null> => {
  try {
    const { data } = await axios.get<unknown>(FORGEJO_API_URL, { timeout: REQUEST_TIMEOUT })
    return parseRelease(data)
  } catch (error) {
    console.warn('[version-check] Failed to fetch release from Forgejo:', error)
    return null
  }
}

const fetchFromCodeberg = async (): Promise<LatestReleaseInfo | null> => {
  try {
    const { data } = await axios.get<unknown>(CODEBERG_API_URL, { timeout: REQUEST_TIMEOUT })
    return parseRelease(data)
  } catch (error) {
    console.warn('[version-check] Failed to fetch release from Codeberg:', error)
    return null
  }
}

const fetchFromGitHub = async (): Promise<LatestReleaseInfo | null> => {
  try {
    const { data } = await axios.get<unknown>(GITHUB_API_URL, { timeout: REQUEST_TIMEOUT })
    return parseRelease(data)
  } catch (error) {
    console.warn('[version-check] Failed to fetch release from GitHub:', error)
    return null
  }
}

export const fetchLatestRelease = async (): Promise<LatestReleaseInfo | null> => {
  const forgejoResult = await fetchFromForgejo()
  if (forgejoResult) return forgejoResult

  const codebergResult = await fetchFromCodeberg()
  if (codebergResult) return codebergResult

  return fetchFromGitHub()
}
