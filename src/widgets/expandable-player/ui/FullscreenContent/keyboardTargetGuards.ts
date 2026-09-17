export type SeekDirection = 'backward' | 'forward'

const INTERACTIVE_TAGS = new Set(['A', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA'])
const INTERACTIVE_ROLES = new Set([
  'button',
  'checkbox',
  'combobox',
  'link',
  'listbox',
  'menuitem',
  'option',
  'radio',
  'searchbox',
  'slider',
  'spinbutton',
  'switch',
  'tab',
  'textbox',
])

export const getSeekDirection = (key: string): null | SeekDirection =>
  key === 'ArrowLeft' ? 'backward' : key === 'ArrowRight' ? 'forward' : null

const getTagName = (target: EventTarget): null | string => {
  if (!('tagName' in target)) return null
  const tagName = target.tagName
  return typeof tagName === 'string' ? tagName : null
}

export const isEditableTarget = (target: EventTarget | null): boolean => {
  if (!target) return false
  const tagName = getTagName(target)
  if (tagName === 'INPUT' || tagName === 'TEXTAREA') return true
  return 'isContentEditable' in target && target.isContentEditable === true
}

const getRole = (target: EventTarget): null | string => {
  if (!('getAttribute' in target)) return null
  const getAttribute = target.getAttribute
  if (typeof getAttribute !== 'function') return null
  const role = getAttribute.call(target, 'role')
  return typeof role === 'string' ? role : null
}

export const isInteractiveTarget = (target: EventTarget | null): boolean => {
  if (!target) return false
  const tagName = getTagName(target)
  if (tagName && INTERACTIVE_TAGS.has(tagName)) return true
  if ('isContentEditable' in target && target.isContentEditable === true) return true
  const role = getRole(target)
  return role !== null && INTERACTIVE_ROLES.has(role)
}
