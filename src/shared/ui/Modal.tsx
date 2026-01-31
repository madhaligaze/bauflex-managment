import { ReactNode, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from './Button';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children?: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  showCloseButton?: boolean;
  
  // ✅ НОВЫЕ ПРОПСЫ для confirmation dialog
  onConfirm?: () => void | Promise<void>;
  confirmText?: string;
  cancelText?: string;
  description?: string;
  isLoading?: boolean;
  variant?: 'default' | 'danger' | 'success';
}

export const Modal = ({ 
  isOpen, 
  onClose, 
  title, 
  children,
  size = 'md',
  showCloseButton = true,
  // Новые пропсы
  onConfirm,
  confirmText = 'Подтвердить',
  cancelText = 'Отмена',
  description,
  isLoading = false,
  variant = 'default'
}: ModalProps) => {
  
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleConfirm = async () => {
    if (onConfirm && !isLoading) {
      await onConfirm();
    }
  };

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-7xl mx-4'
  };

  const variantColors = {
    default: {
      accent: 'from-indigo-500 to-indigo-600',
      button: 'bg-indigo-600 hover:bg-indigo-500',
      glow: 'bg-indigo-500/10'
    },
    success: {
      accent: 'from-green-500 to-green-600',
      button: 'bg-green-600 hover:bg-green-500',
      glow: 'bg-green-500/10'
    },
    danger: {
      accent: 'from-red-500 to-red-600',
      button: 'bg-red-600 hover:bg-red-500',
      glow: 'bg-red-500/10'
    }
  };

  const colors = variantColors[variant];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Enhanced backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={!isLoading ? onClose : undefined}
            className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl"
          />

          {/* Modal container with spring animation */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className={`relative ${sizeClasses[size]} w-full`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Glassmorphism card with gradient */}
            <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-white/10">
              {/* Background layers */}
              <div className="absolute inset-0 bg-gradient-to-br from-slate-900/98 via-slate-950/98 to-slate-900/98 backdrop-blur-2xl" />
              
              {/* Subtle pattern overlay */}
              <div className="absolute inset-0 opacity-[0.03] bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')]" />
              
              {/* Accent glow */}
              <div className={`absolute -top-40 -right-40 w-80 h-80 ${colors.glow} rounded-full blur-3xl`} />
              <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl" />

              {/* Content */}
              <div className="relative z-10">
                {/* Header */}
                {title && (
                  <div className="flex items-center justify-between p-6 border-b border-white/10 bg-white/[0.02]">
                    <h2 className="text-2xl font-black text-white uppercase tracking-tight flex items-center gap-3">
                      <span className={`w-1 h-6 bg-gradient-to-b ${colors.accent} rounded-full`} />
                      {title}
                    </h2>
                    
                    {showCloseButton && !isLoading && (
                      <motion.button
                        whileHover={{ scale: 1.1, rotate: 90 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={onClose}
                        className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 hover:bg-red-500/20 border border-white/10 hover:border-red-500/30 text-white/60 hover:text-red-400 transition-all"
                      >
                        <X size={20} />
                      </motion.button>
                    )}
                  </div>
                )}

                {/* Body */}
                <div className="max-h-[calc(100vh-12rem)] overflow-y-auto custom-scrollbar">
                  {/* Description for confirmation dialogs */}
                  {description && !children && (
                    <div className="p-6">
                      <div className="flex items-start gap-4">
                        {variant === 'success' && (
                          <div className="w-12 h-12 rounded-2xl bg-green-500/20 flex items-center justify-center flex-shrink-0">
                            <CheckCircle className="text-green-400" size={24} />
                          </div>
                        )}
                        {variant === 'danger' && (
                          <div className="w-12 h-12 rounded-2xl bg-red-500/20 flex items-center justify-center flex-shrink-0">
                            <AlertCircle className="text-red-400" size={24} />
                          </div>
                        )}
                        <p className="text-white/80 text-lg leading-relaxed flex-1 pt-2">
                          {description}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {/* Custom children */}
                  {children}
                </div>

                {/* Footer with action buttons (только если есть onConfirm) */}
                {onConfirm && (
                  <div className="flex items-center justify-end gap-3 p-6 border-t border-white/10 bg-white/[0.02]">
                    <Button
                      variant="ghost"
                      onClick={onClose}
                      disabled={isLoading}
                      className="px-6"
                    >
                      {cancelText}
                    </Button>
                    <Button
                      onClick={handleConfirm}
                      disabled={isLoading}
                      className={`px-8 ${colors.button} shadow-lg relative overflow-hidden`}
                    >
                      {isLoading ? (
                        <div className="flex items-center gap-2">
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                          />
                          <span>Отправка...</span>
                        </div>
                      ) : (
                        confirmText
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
