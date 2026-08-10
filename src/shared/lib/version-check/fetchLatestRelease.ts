/* eslint-disable camelcase -- GitHub/Forgejo release API fields are snake_case */
import axios from 'axios'
import z from 'zod'
import type { LatestReleaseInfo } from './types'

const FORGEJO_API_URL =
  'https://git.lightnode.ru/api/v1/repos/Slovo_Propovedi/slovo-propovedi-mobile/releases/latest'
const GITHUB_API_URL =
  'https://api.github.com/repos/Slovo-Propovedi/slovo-propovedi-mobile/releases/latest'
const REQUEST_TIMEOUT = 10000

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

  const apkAsset = release.assets.find(asset => asset.name.endsWith('.apk'))

  return {
    apkDownloadUrl: apkAsset?.browser_download_url ?? null,
    body: release.body.replace(/\r\n/g, '\n'),
    htmlUrl: release.html_url,
    name: release.name,
    publishedAt: release.published_at,
    tagName: release.tag_name,
    version: release.tag_name.replace(/^v/, ''),
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

  return fetchFromGitHub()
}
