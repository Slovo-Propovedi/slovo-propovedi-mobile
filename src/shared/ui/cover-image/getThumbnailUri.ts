// Stored artwork is `<MinIO>/files/<uuid>.<ext>`; the backend keeps a
// card-size WebP preview at `<MinIO>/files/thumbs/<uuid>.webp` (≤ 640 px,
// tens of KB instead of a 1–1.7 MB original). Not part of the API schema —
// a naming convention, so callers must fall back to the original on error.
const STORED_IMAGE_PATTERN =
  /^(.+\/files\/)([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\.(jpe?g|png|webp)$/i

/**
 * Preview URL of a stored cover, or `null` when the uri is not a stored image
 * (external URL, placeholder, other formats).
 * @param uri - Artwork URL.
 */
export const getThumbnailUri = (uri: null | string | undefined): null | string => {
  const match = uri ? STORED_IMAGE_PATTERN.exec(uri) : null

  return match ? `${match[1]}thumbs/${match[2]}.webp` : null
}
