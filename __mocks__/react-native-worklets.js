jest.mock('react-native-worklets', () => {
  return {
    __esModule: true,
    scheduleOnRN: (fn, ...args) => fn(...args),
    scheduleOnUI: (fn, ...args) => fn(...args),
  }
})
