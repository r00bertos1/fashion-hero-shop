"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";

interface User {
  email: string;
  firstName: string;
  lastName: string;
}

interface AuthContextValue {
  user: User | null;
  isHydrated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { email: string; password: string; firstName: string; lastName: string }) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const STORAGE_KEY = "stepforward_user";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setUser(JSON.parse(stored));
      }
    } catch {
      // ignore parse errors
    }
    setIsHydrated(true);
  }, []);

  const login = useCallback(async (email: string, _password: string) => {
    // Mock login — always succeeds
    const newUser: User = {
      email,
      firstName: email.split("@")[0],
      lastName: "",
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newUser));
    setUser(newUser);
  }, []);

  const register = useCallback(async (data: { email: string; password: string; firstName: string; lastName: string }) => {
    const newUser: User = {
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newUser));
    setUser(newUser);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isHydrated, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
