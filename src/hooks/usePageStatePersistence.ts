import { useEffect, useCallback } from 'react';

export interface PageState {
  route?: string;
  activeTab?: string;
  showForm?: boolean;
  formType?: string;
  editingId?: string;
  timestamp?: number;
}

export function usePageStatePersistence(key: string) {
  const savePageState = useCallback((state: PageState) => {
    try {
      const stateWithTimestamp = {
        ...state,
        timestamp: Date.now()
      };
      localStorage.setItem(`page-state-${key}`, JSON.stringify(stateWithTimestamp));
    } catch (error) {
      console.error('Error saving page state:', error);
    }
  }, [key]);

  const loadPageState = useCallback((): PageState | null => {
    try {
      const saved = localStorage.getItem(`page-state-${key}`);
      if (!saved) return null;
      
      const parsed = JSON.parse(saved);
      
      // Check if state is older than 1 hour (prevent stale state)
      const oneHour = 60 * 60 * 1000;
      if (parsed.timestamp && Date.now() - parsed.timestamp > oneHour) {
        localStorage.removeItem(`page-state-${key}`);
        return null;
      }
      
      return parsed;
    } catch (error) {
      console.error('Error loading page state:', error);
      localStorage.removeItem(`page-state-${key}`);
      return null;
    }
  }, [key]);

  const clearPageState = useCallback(() => {
    localStorage.removeItem(`page-state-${key}`);
  }, [key]);

  return {
    savePageState,
    loadPageState,
    clearPageState
  };
}