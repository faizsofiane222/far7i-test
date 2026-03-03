import { useState, useEffect } from 'react';

const RATE_LIMIT_KEY_PREFIX = 'far7i_rate_limit_';
const RATE_LIMIT_DURATION = 60 * 60 * 1000; // 1 heure en millisecondes

interface RateLimitOptions {
  key: string;
  duration?: number;
}

export function useRateLimit({ key, duration = RATE_LIMIT_DURATION }: RateLimitOptions) {
  const [canSubmit, setCanSubmit] = useState(true);
  const [remainingTime, setRemainingTime] = useState(0);
  const storageKey = `${RATE_LIMIT_KEY_PREFIX}${key}`;

  useEffect(() => {
    checkRateLimit();
    
    // Update remaining time every second
    const interval = setInterval(() => {
      checkRateLimit();
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const checkRateLimit = () => {
    const lastSubmit = localStorage.getItem(storageKey);
    if (lastSubmit) {
      const elapsed = Date.now() - parseInt(lastSubmit);
      if (elapsed < duration) {
        setCanSubmit(false);
        setRemainingTime(Math.ceil((duration - elapsed) / 1000 / 60));
      } else {
        setCanSubmit(true);
        setRemainingTime(0);
        localStorage.removeItem(storageKey);
      }
    } else {
      setCanSubmit(true);
      setRemainingTime(0);
    }
  };

  const recordSubmit = () => {
    localStorage.setItem(storageKey, Date.now().toString());
    setCanSubmit(false);
    checkRateLimit();
  };

  const reset = () => {
    localStorage.removeItem(storageKey);
    setCanSubmit(true);
    setRemainingTime(0);
  };

  return { canSubmit, remainingTime, recordSubmit, reset };
}
