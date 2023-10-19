import { useEffect, useState } from 'react';

export const useTimer = (startValue: number, timeout = 1000) => {
  const [countdownValue, setCountdownValue] = useState(startValue);

  const restartTimer = () => {
    setCountdownValue(startValue);
  };

  useEffect(() => {
    const intervalHandle = setInterval(() => {
      if (countdownValue <= 0) {
        clearInterval(intervalHandle);
      } else {
        setCountdownValue(countdownValue - 1);
      }
    }, timeout);

    return () => clearInterval(intervalHandle);
  }, [countdownValue]);

  useEffect(() => {
    startValue && restartTimer();
  }, [startValue]);

  return { countdownValue, restartTimer };
};
