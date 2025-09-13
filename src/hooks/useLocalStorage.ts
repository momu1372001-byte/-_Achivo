import { useState, useEffect } from 'react';

export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (item && item !== 'undefined' && item !== 'null') {
        return JSON.parse(item, (k, value) => {
          // ✅ رجّع التاريخ كـ Date object لو كان string
          if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
            return new Date(value);
          }
          return value;
        });
      }
      return initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      // ❌ ما نمسحش البيانات، نرجع بس initialValue
      return initialValue;
    }
  });

  const setValue = (value: T) => {
    try {
      setStoredValue(value);
      if (value === undefined || value === null) {
        window.localStorage.removeItem(key);
      } else {
        window.localStorage.setItem(key, JSON.stringify(value));
      }
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  };

  // ✅ تحديث أوتوماتيكي لو localStorage اتغير من تاب تاني
  useEffect(() => {
    const handleStorage = () => {
      try {
        const item = window.localStorage.getItem(key);
        if (item) {
          setStoredValue(JSON.parse(item));
        }
      } catch (error) {
        console.error(`Error syncing localStorage key "${key}":`, error);
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [key]);

  return [storedValue, setValue];
}
