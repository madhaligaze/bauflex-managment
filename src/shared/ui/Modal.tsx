import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle } from 'lucide-react';
import { Button } from './Button';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  title: string;
  description?: string; // ✅ Теперь опциональный
  children?: React.ReactNode;
}

export const Modal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  description, 
  children 
}: ModalProps) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[100] flex items-center justify-center p-4"
          >
            {/* Modal Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm bg-white rounded-[32px] shadow-2xl overflow-hidden border border-slate-100"
            >
              <div className="p-8 text-center">
                <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-5 text-indigo-600">
                  <AlertCircle size={28} />
                </div>
                
                <h3 className="text-xl font-bold text-slate-900 mb-2">{title}</h3>
                
                {/* ✅ Показываем description только если он передан */}
                {description && (
                  <p className="text-slate-500 text-sm mb-6 leading-relaxed">
                    {description}
                  </p>
                )}

                {/* Рендерим дочерние элементы, если они переданы */}
                {children && (
                  <div className="mb-6 text-left">
                    {children}
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-3">
                  <Button 
                    variant="secondary" 
                    onClick={onClose}
                    className="h-12 rounded-xl border-slate-200 text-slate-600"
                  >
                    Отмена
                  </Button>
                  
                  {onConfirm && (
                    <Button 
                      onClick={onConfirm}
                      className="h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-600/20"
                    >
                      Подтвердить
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
