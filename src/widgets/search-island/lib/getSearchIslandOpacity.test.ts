import { getSearchIslandOpacity } from './getSearchIslandOpacity'

// The pill frame must not fade: it collapses onto the search circle by
// geometry, then disappears at the settle frame. Opacity may only crossfade
// the content, never the frame itself.
describe('getSearchIslandOpacity', () => {
  test('hidden at rest with the search closed', () => {
    expect(getSearchIslandOpacity(0, false)).toBe(0)
  })

  test('opaque from the first frame of the open flip', () => {
    expect(getSearchIslandOpacity(0, true)).toBe(1)
  })

  test('stays fully opaque through every frame of the closing morph', () => {
    expect(getSearchIslandOpacity(0.001, false)).toBe(1)
    expect(getSearchIslandOpacity(0.5, false)).toBe(1)
    expect(getSearchIslandOpacity(0.999, false)).toBe(1)
  })

  test('hides only once the closing morph has settled', () => {
    expect(getSearchIslandOpacity(0, false)).toBe(0)
  })
})
