import { create } from 'zustand';
import { ToastType, ToastProps } from './Toast';

interface ToastStore {
  toasts: ToastProps[];
  addToast: (type: ToastType, message: string, duration?: number) => void;
  removeToast: (id: string) => void;
  success: (message: string, duration?: number) => void;
  error: (message: string, duration?: number) => void;
  warning: (message: string, duration?: number) => void;
  info: (message: string, duration?: number) => void;
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  
  addToast: (type, message, duration = 5000) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    set((state) => ({
      toasts: [
        ...state.toasts,
        {
          id,
          type,
          message,
          duration,
          onClose: (id: string) => state.removeToast(id)
        }
      ]
    }));
  },
  
  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((toast) => toast.id !== id)
    }));
  },

  success: (message, duration) => {
    set((state) => {
      state.addToast('success', message, duration);
      return state;
    });
  },

  error: (message, duration) => {
    set((state) => {
      state.addToast('error', message, duration);
      return state;
    });
  },

  warning: (message, duration) => {
    set((state) => {
      state.addToast('warning', message, duration);
      return state;
    });
  },

  info: (message, duration) => {
    set((state) => {
      state.addToast('info', message, duration);
      return state;
    });
  }
}));
