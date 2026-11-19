import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { ToastViewport } from '../components/common/ToastViewport.jsx';

const ToastContext = createContext(null);
let toastCounter = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((current) => current.filter((toastItem) => toastItem.id !== id));
  }, []);

  const addToast = useCallback(
    (type, message, duration = 4500) => {
      const id = `toast-${++toastCounter}`;
      setToasts((current) => [...current.slice(-3), { id, type, message }]);
      if (duration > 0) {
        window.setTimeout(() => removeToast(id), duration);
      }
      return id;
    },
    [removeToast]
  );

  const toast = useMemo(
    () => ({
      success: (message, duration) => addToast('success', message, duration),
      error: (message, duration) => addToast('error', message, duration),
      info: (message, duration) => addToast('info', message, duration),
      add: addToast,
    }),
    [addToast]
  );

  return (
    <ToastContext.Provider value={{ toast, removeToast }}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={removeToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}
