
"use client";

import { useState, useEffect, useCallback } from 'react';

function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] {
  // Initialize state with initialValue to ensure consistency between server and initial client render.
  const [storedValue, setStoredValue] = useState<T>(initialValue);

  // Memoized function to read the value from localStorage.
  const readValueFromStorage = useCallback((): T => {
    // Prevent build errors "window is undefined" but keep working
    if (typeof window === 'undefined') {
      return initialValue;
    }

    try {
      const item = window.localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key “${key}”:`, error);
      return initialValue;
    }
  }, [initialValue, key]);

  // Effect to read the value from localStorage after the component has mounted on the client.
  useEffect(() => {
    // Set the stored value from localStorage after the initial render.
    setStoredValue(readValueFromStorage());
  }, [readValueFromStorage]); // readValueFromStorage is memoized and its dependencies [initialValue, key] are handled by useCallback.

  // Wrapped version of useState's setter function that persists the new value to localStorage.
  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      // Prevent build errors "window is undefined"
      if (typeof window === 'undefined') {
        console.warn(
          `Tried setting localStorage key “${key}” even though environment is not a client`
        );
        return;
      }

      try {
        // Allow value to be a function so we have same API as useState
        const valueToStore =
          value instanceof Function ? value(storedValue) : value;
        // Save state
        setStoredValue(valueToStore);
        // Save to local storage
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      } catch (error) {
        console.warn(`Error setting localStorage key “${key}”:`, error);
      }
    },
    [key, storedValue] // Include storedValue as a dependency because it's used in the functional update form of setValue.
  );

  // Effect to listen for storage changes from other tabs/windows.
  useEffect(() => {
    if (typeof window === 'undefined') {
      return; // Ensure this runs only on the client
    }

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === key) {
        if (event.newValue) {
          try {
            setStoredValue(JSON.parse(event.newValue) as T);
          } catch (error) {
            console.warn(`Error parsing localStorage key “${key}” on storage event:`, error);
          }
        } else {
          // Item was removed or cleared from another tab
          setStoredValue(initialValue);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [key, initialValue]);

  return [storedValue, setValue];
}

export default useLocalStorage;
