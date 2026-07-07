import * as SecureStore from 'expo-secure-store';
import api from './api';

/**
 * Store access + refresh tokens securely on device
 */
export const storeTokens = async (accessToken, refreshToken) => {
  await SecureStore.setItemAsync('accessToken', accessToken);
  await SecureStore.setItemAsync('refreshToken', refreshToken);
};

/**
 * Clear tokens from device
 */
export const clearTokens = async () => {
  await SecureStore.deleteItemAsync('accessToken');
  await SecureStore.deleteItemAsync('refreshToken');
};

/**
 * Check whether there is a stored access token
 */
export const hasStoredToken = async () => {
  const token = await SecureStore.getItemAsync('accessToken');
  return !!token;
};

/**
 * Register a new account
 * @returns {{ user, accessToken, refreshToken }}
 */
export const register = async ({ name, email, password }) => {
  const { data } = await api.post('/auth/register', { name, email, password });
  await storeTokens(data.data.accessToken, data.data.refreshToken);
  return data.data;
};

/**
 * Log in
 * @returns {{ user, accessToken, refreshToken }}
 */
export const login = async ({ email, password }) => {
  const { data } = await api.post('/auth/login', { email, password });
  await storeTokens(data.data.accessToken, data.data.refreshToken);
  return data.data;
};

/**
 * Fetch current user (validates stored token)
 */
export const getMe = async () => {
  const { data } = await api.get('/auth/me');
  return data.data.user;
};

/**
 * Logout current device
 */
export const logout = async () => {
  try {
    const refreshToken = await SecureStore.getItemAsync('refreshToken');
    await api.post('/auth/logout', { refreshToken });
  } catch {
    // Ignore — clear tokens regardless
  } finally {
    await clearTokens();
  }
};

/**
 * Update profile (name, theme)
 */
export const updateProfile = async (updates) => {
  const { data } = await api.put('/auth/profile', updates);
  return data.data.user;
};

/**
 * Change password
 */
export const changePassword = async ({ currentPassword, newPassword }) => {
  const { data } = await api.put('/auth/password', { currentPassword, newPassword });
  return data;
};

/**
 * Set / change / remove PIN
 * Pass newPin = null to disable
 */
export const updatePin = async ({ currentPin, newPin }) => {
  const { data } = await api.put('/auth/pin', { currentPin, newPin });
  return data;
};

/**
 * Verify PIN (used before delete)
 */
export const verifyPin = async (pin) => {
  const { data } = await api.post('/auth/verify-pin', { pin });
  return data.data.valid;
};
