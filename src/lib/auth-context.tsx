"use client";

import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';

interface User {
  id: number;
  phone: string;
  name: string;
}

interface Family {
  id: number;
  name: string;
  role?: string;
}

interface AuthContextType {
  user: User | null;
  families: Family[];
  currentFamily: Family | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  wasKicked: boolean;
  login: (phone: string) => Promise<{ success: boolean; error?: string; needsRegister?: boolean }>;
  register: (phone: string, name: string) => Promise<{ success: boolean; error?: string; wasInvited?: boolean }>;
  logout: () => Promise<void>;
  switchFamily: (familyId: number) => Promise<void>;
  refreshAuth: () => Promise<void>;
  clearKicked: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

// Pages that don't require auth check
const PUBLIC_PAGES = ['/', '/login', '/welcome'];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [families, setFamilies] = useState<Family[]>([]);
  const [currentFamily, setCurrentFamily] = useState<Family | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [wasKicked, setWasKicked] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  
  // Use ref to track if user was logged in (to avoid dependency issues)
  const wasLoggedInRef = useRef(false);
  const isInitialLoadRef = useRef(true);

  // Clear all local data when user is kicked or logs in fresh
  const clearAllLocalData = async () => {
    // Clear localStorage
    localStorage.clear();
    // Clear sessionStorage
    sessionStorage.clear();
    // Clear IndexedDB (shopping list data)
    if (typeof indexedDB !== 'undefined') {
      indexedDB.deleteDatabase('KitchenListDB');
    }
  };

  const refreshAuth = async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      
      if (data.authenticated) {
        const newFamilies = data.families || [];
        const newCurrentFamily = data.currentFamily;
        
        setUser(data.user);
        setFamilies(newFamilies);
        setCurrentFamily(newCurrentFamily);
        wasLoggedInRef.current = true;
        
        // If user has no families at all - they were kicked from all families
        // Don't trigger on initial load, only on subsequent checks
        if (!isInitialLoadRef.current && newFamilies.length === 0 && !PUBLIC_PAGES.includes(pathname)) {
          clearAllLocalData();
          setWasKicked(true);
          router.push('/');
        }
      } else {
        // User is no longer authenticated - clear and redirect
        const wasLoggedIn = wasLoggedInRef.current;
        setUser(null);
        setFamilies([]);
        setCurrentFamily(null);
        wasLoggedInRef.current = false;
        
        if (wasLoggedIn && !isInitialLoadRef.current && !PUBLIC_PAGES.includes(pathname)) {
          clearAllLocalData();
          setWasKicked(true);
          router.push('/');
        }
      }
    } catch (error) {
      console.error('Auth refresh error:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
      isInitialLoadRef.current = false;
    }
  };

  // Initial auth check
  useEffect(() => {
    refreshAuth();
  }, []);

  // Periodic auth check every 15 seconds (to detect kicks)
  useEffect(() => {
    if (!PUBLIC_PAGES.includes(pathname)) {
      const interval = setInterval(() => {
        refreshAuth();
      }, 15000);
      
      return () => clearInterval(interval);
    }
  }, [pathname]);

  const clearKicked = () => setWasKicked(false);

  const login = async (phone: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone })
      });
      
      const data = await res.json();
      
      if (res.status === 404) {
        return { success: false, needsRegister: true, error: data.error };
      }
      
      if (!res.ok) {
        return { success: false, error: data.error };
      }
      
      // Clear old local data before setting new user (to load fresh from server)
      await clearAllLocalData();
      
      setUser(data.user);
      setFamilies(data.families || []);
      setCurrentFamily(data.currentFamily);
      
      return { success: true };
    } catch (error) {
      return { success: false, error: 'שגיאת רשת' };
    }
  };

  const register = async (phone: string, name: string): Promise<{ success: boolean; error?: string; wasInvited?: boolean }> => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, name })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        return { success: false, error: data.error };
      }
      
      setUser(data.user);
      // Handle both new user (single family) and invited user (multiple families)
      if (data.families) {
        setFamilies(data.families);
      } else if (data.family) {
        setFamilies([data.family]);
      }
      setCurrentFamily(data.family);
      wasLoggedInRef.current = true;
      
      return { success: true, wasInvited: data.wasInvited };
    } catch (error) {
      return { success: false, error: 'שגיאת רשת' };
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } finally {
      setUser(null);
      setFamilies([]);
      setCurrentFamily(null);
    }
  };

  const switchFamily = async (familyId: number) => {
    try {
      const res = await fetch('/api/family/switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ familyId })
      });
      
      if (res.ok) {
        const family = families.find(f => f.id === familyId);
        if (family) setCurrentFamily(family);
      }
    } catch (error) {
      console.error('Switch family error:', error);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      families,
      currentFamily,
      isLoading,
      isAuthenticated: !!user,
      wasKicked,
      login,
      register,
      logout,
      switchFamily,
      refreshAuth,
      clearKicked
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

