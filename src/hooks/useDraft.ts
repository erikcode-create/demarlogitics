import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';

interface UseDraftOptions<T> {
  key: string;
  defaultValue: T;
  debounceMs?: number;
}

interface UseDraftReturn<T> {
  data: T;
  setData: React.Dispatch<React.SetStateAction<T>>;
  hasDraft: boolean;
  clearDraft: () => void;
  draftRestoredRef: React.MutableRefObject<boolean>;
}

export function useDraft<T>({ key, defaultValue, debounceMs = 500 }: UseDraftOptions<T>): UseDraftReturn<T> {
  const storageKey = `draft:${key}`;
  const draftRestoredRef = useRef(false);

  const [data, setData] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        draftRestoredRef.current = true;
        return JSON.parse(stored) as T;
      }
    } catch {}
    return defaultValue;
  });

  const [hasDraft, setHasDraft] = useState(() => {
    return localStorage.getItem(storageKey) !== null;
  });

  // Show toast on mount if draft was restored
  useEffect(() => {
    if (draftRestoredRef.current) {
      toast.info('Draft restored', { description: 'Your previous progress has been loaded.' });
    }
  }, []);

  // Debounced auto-save
  useEffect(() => {
    const timer = setTimeout(() => {
      // Only save if data differs from default
      const serialized = JSON.stringify(data);
      const defaultSerialized = JSON.stringify(defaultValue);
      if (serialized !== defaultSerialized) {
        localStorage.setItem(storageKey, serialized);
        setHasDraft(true);
      }
    }, debounceMs);
    return () => clearTimeout(timer);
  }, [data, storageKey, debounceMs, defaultValue]);

  const clearDraft = useCallback(() => {
    localStorage.removeItem(storageKey);
    setHasDraft(false);
    setData(defaultValue);
    draftRestoredRef.current = false;
  }, [storageKey, defaultValue]);

  return { data, setData, hasDraft, clearDraft, draftRestoredRef };
}
