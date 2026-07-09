jest.mock('react-native-worklets', () => {
  return {
    __esModule: true,
    scheduleOnUI: (fn, ...args) => fn(...args),
  }
})
