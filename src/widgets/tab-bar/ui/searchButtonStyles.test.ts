import { searchButtonStyles } from './searchButtonStyles'

// On Android the touch dispatcher (TouchTargetHelper) only descends into the
// children of a View when the touch point is inside that View's bounds. The
// detached circle is an absolute child of `column`, and the layer's height used
// to be content-derived: with only absolutely-positioned children the layer
// measured ~0 tall, so its descendant circle was outside the parent bounds and
// never received the tap. The layer must therefore span the full height it is
// anchored to, and the column must fill that layer.
describe('searchButtonStyles touch host', () => {
  test('the layer spans the full height between its anchored edges', () => {
    expect(searchButtonStyles.layer.top).toBe(0)
    expect(searchButtonStyles.layer.bottom).toBe(0)
  })

  test('the centred column fills the layer height', () => {
    expect(searchButtonStyles.column.height).toBe('100%')
    expect(searchButtonStyles.column.width).toBe('100%')
  })
})
