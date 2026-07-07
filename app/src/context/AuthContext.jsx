import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getMe, login as apiLogin, register as apiRegister, logout as apiLogout } from '../services/authService';
import { hasStoredToken, clearTokens } from '../services/authService';
import { clearLocalData, saveTheme, loadTheme } from '../storage/localStore';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true); // checking stored token
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [theme, setThemeState] = useState('dark');

  // ── Boot: check for stored token ─────────────────────────────
  useEffect(() => {
    const bootCheck = async () => {
      try {
        const storedTheme = await loadTheme();
        setThemeState(storedTheme);

        const hasToken = await hasStoredToken();
        if (!hasToken) return;

        // Validate token by fetching current user
        const me = await getMe();
        setUser(me);
        setIsAuthenticated(true);
        // Sync theme preference from server
        if (me.theme) {
          setThemeState(me.theme);
          await saveTheme(me.theme);
        }
      } catch {
        // Token invalid or expired — clear and show login
        await clearTokens();
      } finally {
        setIsLoading(false);
      }
    };
    bootCheck();
  }, []);

  // ── Login ─────────────────────────────────────────────────────
  const login = useCallback(async (credentials) => {
    const { user: me } = await apiLogin(credentials);
    setUser(me);
    setIsAuthenticated(true);
    if (me.theme) {
      setThemeState(me.theme);
      await saveTheme(me.theme);
    }
    return me;
  }, []);

  // ── Register ──────────────────────────────────────────────────
  const register = useCallback(async (details) => {
    const { user: me } = await apiRegister(details);
    setUser(me);
    setIsAuthenticated(true);
    return me;
  }, []);

  // ── Logout ────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    await apiLogout();
    await clearLocalData();
    setUser(null);
    setIsAuthenticated(false);
  }, []);

  // ── Update local user state ───────────────────────────────────
  const refreshUser = useCallback(async () => {
    try {
      const me = await getMe();
      setUser(me);
    } catch {}
  }, []);

  // ── Toggle theme ──────────────────────────────────────────────
  const toggleTheme = useCallback(async () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setThemeState(next);
    await saveTheme(next);
    // Persist to server if logged in
    if (isAuthenticated) {
      try {
        const { updateProfile } = await import('../services/authService');
        await updateProfile({ theme: next });
      } catch {}
    }
  }, [theme, isAuthenticated]);

  const setTheme = useCallback(async (t) => {
    setThemeState(t);
    await saveTheme(t);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated,
        theme,
        login,
        register,
        logout,
        refreshUser,
        toggleTheme,
        setTheme,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
