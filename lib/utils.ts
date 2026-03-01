import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const store = new Map<string, { count: number; reset: number }>();

export function simpleRateLimit(key: string, max = 30, windowMs = 60_000) {
  const now = Date.now();
  const current = store.get(key);
  if (!current || current.reset < now) {
    store.set(key, { count: 1, reset: now + windowMs });
    return { ok: true };
  }

  if (current.count >= max) return { ok: false };
  current.count += 1;
  return { ok: true };
}
