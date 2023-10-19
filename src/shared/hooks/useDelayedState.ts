import type { Dispatch, SetStateAction } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { debounce } from '../lib';

interface UseDelayedStateProps<T> {
  delay: number;
  initialValue?: T;
}

type UseDelayedState = <T>(
  props: UseDelayedStateProps<T>,
) => [T | undefined, Dispatch<SetStateAction<T | undefined>>, { resetStates: () => void }];

export const useDelayedState: UseDelayedState = ({ delay, initialValue }) => {
  const [value, setValue] = useState(initialValue);
  const [debouncedValue, setDebouncedValue] = useState(initialValue);
  const timer = useRef<NodeJS.Timeout | null>(null);

  const debounceCallback = useMemo(
    () => debounce<typeof value>((debounceValue) => setDebouncedValue(debounceValue), delay),
    [delay],
  );

  const resetStates = () => {
    timer.current && clearTimeout(timer.current);

    setValue(initialValue);
    setDebouncedValue(initialValue);
  };

  useEffect(() => {
    timer.current = debounceCallback(value);

    return () => {
      timer.current && clearTimeout(timer.current);
    };
  }, [debounceCallback, value]);

  return [debouncedValue, setValue, { resetStates }];
};
