export const isNonNullable = <T>(value: null | T | undefined): value is T =>
  value !== null && value !== undefined
