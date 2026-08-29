import { type Ctx } from '@reatom/framework'
import { downloadUpdateZip } from 'shared/lib/update-service'
import {
  compareVersions,
  fetchLatestRelease,
  type LatestReleaseInfo,
} from 'shared/lib/version-check'
import { latestVersionAtom, releaseUrlAtom, zipDownloadUrlAtom } from './update'
import { updateProgressAtom } from './updateInstall'

export const getFallbackDownloadUrl = (
  failedUrl: string,
  failedVersion: null | string,
  release: LatestReleaseInfo | null,
): null | string => {
  if (!release) return null
  if (failedVersion && compareVersions(release.version, failedVersion) < 0) return null
  const fallbackUrl = release.zipDownloadUrl
  if (!fallbackUrl || fallbackUrl === failedUrl) return null
  return fallbackUrl
}

export const downloadUpdateZipWithFallback = async (
  ctx: Ctx,
  zipDownloadUrl: string,
): Promise<string> => {
  try {
    return await downloadUpdateZip(zipDownloadUrl, percent => {
      ctx.schedule(() => updateProgressAtom(ctx, percent))
    })
  } catch (downloadError) {
    const failedVersion = ctx.get(latestVersionAtom)
    const release = await fetchLatestRelease()
    const fallbackUrl = getFallbackDownloadUrl(zipDownloadUrl, failedVersion, release)
    if (!fallbackUrl || !release) throw downloadError

    await ctx.schedule(() => {
      updateProgressAtom(ctx, 0)
      latestVersionAtom(ctx, release.version)
      releaseUrlAtom(ctx, release.htmlUrl)
      zipDownloadUrlAtom(ctx, release.zipDownloadUrl)
    })

    try {
      return await downloadUpdateZip(fallbackUrl, percent => {
        ctx.schedule(() => updateProgressAtom(ctx, percent))
      })
    } catch {
      throw downloadError
    }
  }
}
