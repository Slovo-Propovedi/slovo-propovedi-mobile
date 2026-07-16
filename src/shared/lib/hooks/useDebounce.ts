import debounce from 'debounce'
import { useMemo } from 'react'
import type { AnyFunction } from '../../model/aliases'

export const useDebounce = <F extends AnyFunction>(action: F, delay: number) =>
  useMemo(() => debounce(action, delay), [action, delay])
