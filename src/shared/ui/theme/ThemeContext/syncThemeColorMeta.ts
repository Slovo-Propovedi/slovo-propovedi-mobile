export const syncThemeColorMeta = (background: string) => {
  // Escape-key/modal tests install a partial `document` stub; only touch the
  // DOM when the real query API is present.
  if (typeof document === 'undefined' || typeof document.querySelectorAll !== 'function') return

  document.querySelectorAll('meta[name="theme-color"]').forEach(meta => {
    meta.setAttribute('content', background)
  })
}
