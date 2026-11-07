import { useState } from 'react'
import { APP_ICON_URI as IMAGE_PLACEHOLDER } from '../../lib/app-icon'
import { getThumbnailUri } from './getThumbnailUri'

/**
 * Source of a cover: the backend's card-size preview for non-eager covers of
 * stored images, the original otherwise (player covers are shown large). A
 * preview that fails to load (not generated yet, other host) switches the
 * cover to the original for good.
 * @param uri - Artwork URL.
 * @param eager - Player covers keep the full-size original.
 */
export const useCoverSource = (uri: null | string | undefined, eager: boolean) => {
  const [failedThumbnail, setFailedThumbnail] = useState<null | string>(null)
  const thumbnail = eager ? null : getThumbnailUri(uri)
  const isThumbnail = thumbnail !== null && thumbnail !== failedThumbnail

  return {
    fallBackToOriginal: () => setFailedThumbnail(thumbnail),
    isThumbnail,
    source: isThumbnail ? thumbnail : uri || IMAGE_PLACEHOLDER,
  }
}
