import { useEffect, useState } from 'react';

export function useCurrentTime(intervalMs: number = 1000): number {
  const [nowMs, setNowMs] = useState<number>(() => Date.now());

  useEffect(() => {
    const timerId = setInterval(() => {
      setNowMs(Date.now());
    }, intervalMs);

    return () => clearInterval(timerId);
  }, [intervalMs]);

  return nowMs;
}
