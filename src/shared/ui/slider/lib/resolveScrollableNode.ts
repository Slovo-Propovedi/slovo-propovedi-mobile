const isElementLikeNode = (child: unknown): child is HTMLElement =>
  typeof child === 'object' && child !== null && 'scrollLeft' in child

// A node scrolls horizontally only when its content overflows and overflow-x
// allows it; 'scrollLeft' alone cannot discriminate (it exists on every
// HTMLElement, including the wrapper divs FlatList renders on web).
const isScrollableNode = (child: unknown): child is HTMLElement => {
  if (!isElementLikeNode(child)) return false
  if (child.scrollWidth <= child.clientWidth) return false
  const overflowX = window.getComputedStyle(child).overflowX
  return overflowX === 'auto' || overflowX === 'scroll'
}

// FlatList renders extra wrapper divs on web; 'scrollLeft' exists on every
// HTMLElement so it cannot discriminate the real scroller. Prefer the direct
// child, then walk all descendants in document order; querySelectorAll('*')
// yields ancestors before children, so the outermost scroller wins.
export const resolveScrollableNode = (node: HTMLElement): HTMLElement | null => {
  const firstChild = node.firstElementChild
  if (isScrollableNode(firstChild)) return firstChild

  const descendants = node.querySelectorAll?.('*') ?? []
  return Array.from(descendants).find(isScrollableNode) ?? null
}
