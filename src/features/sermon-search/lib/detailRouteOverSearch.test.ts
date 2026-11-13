import { isDetailRouteOverSearch } from './detailRouteOverSearch'

describe('isDetailRouteOverSearch', () => {
  test.each(['/listen/preacher', '/listen/playlist', '/settings', '/history'])(
    'hides the open search overlay under %s',
    pathname => {
      expect(isDetailRouteOverSearch(pathname)).toBe(true)
    },
  )

  test.each(['/listen', '/read', '/more'])(
    'keeps the overlay visible on the tab root %s',
    pathname => {
      expect(isDetailRouteOverSearch(pathname)).toBe(false)
    },
  )
})
