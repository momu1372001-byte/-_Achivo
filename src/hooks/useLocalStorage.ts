import { useState, useEffect } from 'react';

export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((val: T) => T)) => void] {
  const readValue = (): T => {
    try {
      const item = window.localStorage.getItem(key);
      if (!item || item === 'undefined' || item === 'null') {
        return initialValue; // أول مرة فقط
      }
      return JSON.parse(item, (k, value) => {
        // ✅ رجّع التاريخ كـ Date object لو كان string
        if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
          return new Date(value);
        }
        return value;
      });
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      // ❌ لو فيه خطأ، ما نرجعش initialValue تاني
      // بدل كده نرجع القيمة الحالية المخزنة
      return storedValueRef.current ?? initialValue;
    }
  };

  // ✅ نحتفظ بالقيمة القديمة في ref
  const storedValueRef = { current: initialValue };

  const [storedValue, setStoredValue] = useState<T>(() => {
    const value = readValue();
    storedValueRef.current = value;
    return value;
  });

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore =
        value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      storedValueRef.current = valueToStore;
      if (valueToStore === undefined || valueToStore === null) {
        window.localStorage.removeItem(key);
      } else {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  };

  // ✅ sync بين التابات
  useEffect(() => {
    const handleStorage = () => {
      setStoredValue(readValue());
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  return [storedValue, setValue];
}
