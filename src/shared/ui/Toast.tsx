import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';
import { useEffect } from 'react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastProps {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
  onClose: (id: string) => void;
}

const icons = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertCircle,
  info: Info
};

const colors = {
  success: {
    bg: 'from-green-500/90 to-emerald-600/90',
    icon: 'text-white',
    border: 'border-green-400/30'
  },
  error: {
    bg: 'from-red-500/90 to-rose-600/90',
    icon: 'text-white',
    border: 'border-red-400/30'
  },
  warning: {
    bg: 'from-amber-500/90 to-orange-600/90',
    icon: 'text-white',
    border: 'border-amber-400/30'
  },
  info: {
    bg: 'from-blue-500/90 to-indigo-600/90',
    icon: 'text-white',
    border: 'border-blue-400/30'
  }
};

export const Toast = ({ id, type, message, duration = 5000, onClose }: ToastProps) => {
  const Icon = icons[type];
  const colorScheme = colors[type];

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose(id);
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [id, duration, onClose]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
      className={`
        relative overflow-hidden rounded-2xl 
        border ${colorScheme.border}
        bg-gradient-to-r ${colorScheme.bg}
        backdrop-blur-xl shadow-2xl
        min-w-[320px] max-w-md
      `}
    >
      {/* Progress bar */}
      {duration > 0 && (
        <motion.div
          initial={{ scaleX: 1 }}
          animate={{ scaleX: 0 }}
          transition={{ duration: duration / 1000, ease: 'linear' }}
          className="absolute bottom-0 left-0 right-0 h-1 bg-white/30 origin-left"
        />
      )}

      <div className="flex items-start gap-3 p-4">
        <div className={`flex-shrink-0 ${colorScheme.icon}`}>
          <Icon size={24} />
        </div>
        
        <div className="flex-1 min-w-0">
          <p className="text-white font-medium leading-relaxed break-words">
            {message}
          </p>
        </div>

        <button
          onClick={() => onClose(id)}
          className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-lg hover:bg-white/20 text-white/80 hover:text-white transition-colors"
        >
          <X size={16} />
        </button>
      </div>
    </motion.div>
  );
};

export const ToastContainer = ({ toasts, onClose }: { 
  toasts: ToastProps[]; 
  onClose: (id: string) => void;
}) => {
  return (
    <div className="fixed top-4 right-4 z-[200] flex flex-col gap-2">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <Toast key={toast.id} {...toast} onClose={onClose} />
        ))}
      </AnimatePresence>
    </div>
  );
};
