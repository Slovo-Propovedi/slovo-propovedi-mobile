type Debounce = <P = void>(func: (props: P) => void, delay: number) => (props: P) => number

export const debounce: Debounce = (func, delay) => {
  if (typeof func !== 'function') throw new Error('Первый аргумент должен быть функцией')

  if (typeof delay !== 'number') throw new Error('Второй аргумент должен быть числом')

  let timerId: number | undefined

  return props => {
    clearTimeout(timerId)

    timerId = setTimeout(() => {
      func(props)

      clearTimeout(timerId)
    }, delay)

    return timerId
  }
}
