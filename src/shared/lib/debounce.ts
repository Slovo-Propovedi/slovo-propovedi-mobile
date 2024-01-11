type Debounce = <P = void>(func: (props: P) => void, delay: number) => (props: P) => NodeJS.Timeout;

export const debounce: Debounce = (func, delay) => {
  if (typeof func !== 'function') throw new Error('Первый аргумент должен быть функцией');

  if (typeof delay !== 'number') throw new Error('Второй аргумент должен быть числом');

  let timer: NodeJS.Timeout | undefined;

  return props => {
    clearTimeout(timer);

    timer = setTimeout(() => {
      func(props);

      clearTimeout(timer);
    }, delay);

    return timer;
  };
};
