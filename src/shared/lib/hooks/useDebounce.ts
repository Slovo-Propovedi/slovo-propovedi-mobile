import debounce from 'debounce'
import { useCallback } from 'react'
import { type AnyFunction } from '../../model/aliases'

export const useDebounce = <F extends AnyFunction>(
  action: F,
  delay: number,
  deps?: React.DependencyList,
) => useCallback(debounce(action, delay), deps || [])
