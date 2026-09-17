interface KeyEventLike {
  altKey?: boolean
  ctrlKey?: boolean
  key?: string
  metaKey?: boolean
  nativeEvent?: { key?: string }
  shiftKey?: boolean
}

const ESCAPE_KEY = 'Escape'

export const hasModifier = (event: KeyEventLike): boolean =>
  Boolean(event.ctrlKey || event.metaKey || event.altKey || event.shiftKey)

export const isEscapeKey = (event: KeyEventLike): boolean => {
  const key = event.key ?? event.nativeEvent?.key
  return key === ESCAPE_KEY && !hasModifier(event)
}
