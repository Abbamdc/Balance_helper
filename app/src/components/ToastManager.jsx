import React, { createContext, useContext, useState, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from '../components/Toast';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback(({ type = 'info', title, message }) => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev.slice(-2), { id, type, title, message }]);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <View style={styles.container} pointerEvents="none">
        {toasts.map((t) => (
          <Toast key={t.id} {...t} onHide={() => removeToast(t.id)} />
        ))}
      </View>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  const { showToast } = ctx;
  return {
    show: (type, title, message) => showToast({ type, title, message }),
    success: (title, message) => showToast({ type: 'success', title, message }),
    warn: (title, message) => showToast({ type: 'warn', title, message }),
    error: (title, message) => showToast({ type: 'error', title, message }),
    info: (title, message) => showToast({ type: 'info', title, message }),
  };
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 56,
    left: 0,
    right: 0,
    zIndex: 9999,
  },
});
