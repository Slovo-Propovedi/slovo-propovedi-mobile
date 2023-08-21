import { debounce } from './debounce';

const stubFunction = () => null;
const stubDelay = 2;

describe('debounce', () => {
  test('first argument is function', () => {
    const errorMessage = 'Первый аргумент должен быть функцией';
    expect(() => debounce('' as never, stubDelay)).toThrowError(errorMessage);
    expect(() => debounce(stubFunction, stubDelay)).not.toThrowError(errorMessage);
  });

  test('second argument is number', () => {
    const errorMessage = 'Второй аргумент должен быть числом';

    expect(() => debounce(stubFunction, undefined as never)).toThrowError(errorMessage);
    expect(() => debounce(stubFunction, '' as never)).toThrowError(errorMessage);
    expect(() => debounce(stubFunction, stubDelay)).not.toThrowError(errorMessage);
  });

  test('return type is function', () => {
    // stubs
    expect(typeof debounce(stubFunction, stubDelay)).toBe('function');
  });

  test('debounced function dont called inside function', () => {
    const mockFunction = jest.fn();

    debounce(mockFunction, stubDelay);

    // mock
    expect(mockFunction).not.toBeCalled();
  });

  test('return type of debounced function is timeout', () => {
    const timeout = debounce(stubFunction, stubDelay)();

    expect(timeout).toBeDefined();
    expect(typeof timeout).toEqual('object');
    expect(timeout).toHaveProperty('hasRef');
  });

  test('timer has been reset after calling the function', () => {
    // используем фейковые таймеры, чтобы можно было проверить setTimeout и clearTimeout
    jest.useFakeTimers();

    // создаем шпион для clearTimeout
    const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');

    const timer = debounce(stubFunction, stubDelay);

    const timerId = timer();

    // переводим таймеры на 1001 мс
    jest.advanceTimersByTime(1001);

    // проверяем, что clearTimeout был вызван с переданным id таймера
    expect(clearTimeoutSpy).toHaveBeenCalledWith(timerId);

    // восстанавливаем заданный метод
    clearTimeoutSpy.mockRestore();
  });
});
