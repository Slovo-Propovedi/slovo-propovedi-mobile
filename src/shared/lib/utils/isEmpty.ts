/**
 * True when an object carries no own enumerable keys. Used by admin forms to
 * tell a pristine value object (no user input yet) from a touched one.
 * @param value - Object to inspect.
 */
export const isEmpty = (value: object): boolean => Object.keys(value).length === 0
