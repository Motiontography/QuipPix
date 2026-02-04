import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import { Toast, ToastType } from '../components/Toast';

interface ToastConfig {
  message: string;
  type?: ToastType;
  duration?: number;
}

interface ToastContextValue {
  showToast: (config: ToastConfig) => void;
}

const ToastContext = createContext<ToastContextValue>({
  showToast: () => {},
});

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [visible, setVisible] = useState(false);
  const [config, setConfig] = useState<ToastConfig>({ message: '' });
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const showToast = useCallback((cfg: ToastConfig) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setConfig(cfg);
    setVisible(true);
    timeoutRef.current = setTimeout(() => {
      setVisible(false);
    }, cfg.duration ?? 2500);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <Toast
        visible={visible}
        message={config.message}
        type={config.type ?? 'success'}
        onDismiss={() => setVisible(false)}
      />
    </ToastContext.Provider>
  );
}
