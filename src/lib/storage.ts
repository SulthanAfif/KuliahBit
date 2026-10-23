import { useCallback, useState, type SetStateAction } from "react";

export function getFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
}

/** React state backed by localStorage, suitable for form drafts and saved data. */
export function usePersistentState<T>(key: string, defaultValue: T): [T, (value: SetStateAction<T>) => void] {
  const [value, setValue] = useState<T>(() => getFromStorage(key, defaultValue));
  const update = useCallback((next: SetStateAction<T>) => {
    setValue((current) => {
      const resolved = typeof next === "function" ? (next as (current: T) => T)(current) : next;
      try { saveToStorage(key, resolved); } catch { /* Keep the in-memory edit if storage is unavailable. */ }
      return resolved;
    });
  }, [key]);
  return [value, update];
}

export function saveToStorage<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function removeFromStorage(key: string) {
  localStorage.removeItem(key);
}
