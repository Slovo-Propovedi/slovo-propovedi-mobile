import { useEffect, useRef, useState } from 'react';

export const useTimer = (startValue: number, timeout = 1000) => {
  const [countdownValue, setCountdownValue] = useState(startValue);

  const intervalHandleRef = useRef<NodeJS.Timeout>();

  const createTimer = () => {
    intervalHandleRef.current = setInterval(() => {
      if (countdownValue <= 0) {
        clearInterval(intervalHandleRef.current);
      } else {
        setCountdownValue(countdownValue - 1);
      }
    }, timeout);
  };

  const restartTimer = () => {
    setCountdownValue(startValue);
  };

  const resumeTimer = () => {
    createTimer();
  };

  const pauseTimer = () => {
    clearInterval(intervalHandleRef.current);
  };

  useEffect(() => {
    createTimer();
    return () => clearInterval(intervalHandleRef.current);
  }, [countdownValue]);

  useEffect(() => {
    startValue && restartTimer();
  }, []);

  return { countdownValue, pauseTimer, restartTimer, resumeTimer, setCountdownValue };
};
