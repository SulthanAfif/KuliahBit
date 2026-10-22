export function getFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
}

export function saveToStorage<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function removeFromStorage(key: string) {
  localStorage.removeItem(key);
}
