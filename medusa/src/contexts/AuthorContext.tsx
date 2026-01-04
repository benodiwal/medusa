import { createContext, useContext, useState, ReactNode } from 'react';
import { AuthorIdentity } from '../types';

interface AuthorContextType {
  identity: AuthorIdentity | null;
  setIdentity: (identity: AuthorIdentity) => void;
  clearIdentity: () => void;
}

const AuthorContext = createContext<AuthorContextType | undefined>(undefined);

const AUTHOR_COLORS = [
  '#3B82F6', // blue
  '#10B981', // green
  '#F59E0B', // amber
  '#EF4444', // red
  '#8B5CF6', // purple
  '#EC4899', // pink
  '#06B6D4', // cyan
  '#F97316', // orange
];

export function getRandomColor(): string {
  return AUTHOR_COLORS[Math.floor(Math.random() * AUTHOR_COLORS.length)];
}

export function AuthorProvider({ children }: { children: ReactNode }) {
  const [identity, setIdentityState] = useState<AuthorIdentity | null>(() => {
    try {
      const stored = localStorage.getItem('medusa-author-identity');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const setIdentity = (newIdentity: AuthorIdentity) => {
    setIdentityState(newIdentity);
    localStorage.setItem('medusa-author-identity', JSON.stringify(newIdentity));
  };

  const clearIdentity = () => {
    setIdentityState(null);
    localStorage.removeItem('medusa-author-identity');
  };

  return (
    <AuthorContext.Provider value={{ identity, setIdentity, clearIdentity }}>
      {children}
    </AuthorContext.Provider>
  );
}

export function useAuthor() {
  const context = useContext(AuthorContext);
  if (!context) {
    throw new Error('useAuthor must be used within AuthorProvider');
  }
  return context;
}
