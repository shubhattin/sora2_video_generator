import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatRemaining(ms: number): string {
  if (ms <= 0) return '0s';

  // Hide seconds if less than a minute: round up to 1m
  if (ms < 60_000) return '1m';

  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  const parts: string[] = [];
  if (days > 0) {
    parts.push(`${days}d`);
    // When days are present, always show hours and minutes
    parts.push(`${hours}h`);
    parts.push(`${minutes}m`);
    return parts.join(' ');
  }

  if (hours > 0) {
    parts.push(`${hours}h`);
    // When hours are present, also show minutes (even if 0)
    parts.push(`${minutes}m`);
    return parts.join(' ');
  }

  // Otherwise only minutes
  return `${minutes}m`;
}
