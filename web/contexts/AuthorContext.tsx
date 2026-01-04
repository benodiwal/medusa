'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AuthorIdentity, getRandomColor } from '../lib/share';

interface AuthorContextType {
  identity: AuthorIdentity | null;
  setIdentity: (identity: AuthorIdentity | null) => void;
}

const AuthorContext = createContext<AuthorContextType | undefined>(undefined);

const STORAGE_KEY = 'medusa_author_identity';

export function AuthorProvider({ children }: { children: ReactNode }) {
  const [identity, setIdentityState] = useState<AuthorIdentity | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load identity from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as AuthorIdentity;
        setIdentityState(parsed);
      }
    } catch (e) {
      console.error('Failed to load author identity:', e);
    }
    setIsLoaded(true);
  }, []);

  // Persist identity changes
  const setIdentity = (newIdentity: AuthorIdentity | null) => {
    setIdentityState(newIdentity);
    if (newIdentity) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newIdentity));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  // Don't render until we've loaded from localStorage
  if (!isLoaded) {
    return null;
  }

  return (
    <AuthorContext.Provider value={{ identity, setIdentity }}>
      {children}
    </AuthorContext.Provider>
  );
}

export function useAuthor() {
  const context = useContext(AuthorContext);
  if (context === undefined) {
    throw new Error('useAuthor must be used within an AuthorProvider');
  }
  return context;
}

export { getRandomColor };
