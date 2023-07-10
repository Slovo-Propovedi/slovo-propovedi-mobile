export const debounce = <P = void>(
  func: (props: P) => void,
  delay: number,
): ((props: P) => NodeJS.Timeout) => {
  let timer: NodeJS.Timeout | undefined;

  return (props) => {
    clearTimeout(timer);
    timer = setTimeout(() => func(props), delay);

    return timer;
  };
};
