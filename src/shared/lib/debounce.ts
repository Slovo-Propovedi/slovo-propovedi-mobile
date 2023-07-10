type Debounce = <P = void>(func: (props: P) => void, delay: number) => (props: P) => NodeJS.Timeout;

export const debounce: Debounce = (func, delay) => {
  let timer: NodeJS.Timeout | undefined;

  return (props) => {
    clearTimeout(timer);
    timer = setTimeout(() => func(props), delay);

    return timer;
  };
};
