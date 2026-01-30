import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

interface SelectProps {
  label: string;
  value: string;
  options: string[];
  onChange: (val: string) => void;
}

export const PremiumSelect = ({ label, value, options, onChange }: SelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Закрытие по клику вне области (для Desktop)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="flex flex-col gap-2 w-full relative" ref={containerRef}>
      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">
        {label}
      </span>
      
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "h-14 w-full flex items-center justify-between px-5 rounded-2xl bg-slate-50 border border-slate-100 transition-all",
          "hover:bg-white hover:border-indigo-200 active:scale-[0.99]",
          isOpen && "bg-white border-indigo-500 ring-4 ring-indigo-500/5 shadow-sm"
        )}
      >
        <span className={cn("text-base truncate mr-2", !value ? "text-slate-400" : "text-slate-900 font-medium")}>
          {value || "Выбрать..."}
        </span>
        <ChevronDown className={cn("w-5 h-5 text-slate-400 transition-transform duration-300 flex-shrink-0", isOpen && "rotate-180")} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop только для Mobile (видимый) и для Desktop (прозрачный затвор) */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] z-[60] md:bg-transparent md:backdrop-blur-none"
            />
            
            {/* Content Container */}
            <motion.div
              // Mobile: снизу вверх | Desktop: появление сверху вниз
              initial={{ y: "100%", opacity: 1 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 1 }}
              transition={{ type: "spring", damping: 30, stiffness: 300, mass: 0.8 }}
              className={cn(
                // Базовые стили Mobile (iOS Sheet)
                "fixed bottom-0 left-0 right-0 z-[70] bg-white rounded-t-[32px] shadow-[0_-8px_40px_rgba(0,0,0,0.12)] max-h-[80vh] overflow-hidden flex flex-col",
                // Адаптация под Desktop (Dropdown)
                "md:absolute md:bottom-auto md:top-[calc(100%+8px)] md:left-0 md:right-0 md:rounded-2xl md:shadow-premium md:max-h-60 md:origin-top"
              )}
              style={{
                // На десктопе отключаем анимацию "выезда снизу"
                transformOrigin: window.innerWidth > 768 ? 'top' : 'bottom'
              }}
            >
              {/* Mobile Drag Handle */}
              <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto my-4 flex-shrink-0 md:hidden" />
              
              <div className="flex-1 overflow-y-auto px-4 pb-8 md:p-2 md:pb-2">
                <div className="flex flex-col gap-1">
                  {options.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => {
                        onChange(opt);
                        setIsOpen(false);
                      }}
                      className={cn(
                        "flex items-center justify-between px-6 py-4 md:px-4 md:py-3 rounded-xl text-left transition-all duration-200",
                        value === opt 
                          ? "bg-indigo-50 text-indigo-700 font-bold" 
                          : "hover:bg-slate-50 text-slate-700 active:bg-slate-100"
                      )}
                    >
                      <span className="text-base md:text-sm">{opt}</span>
                      {value === opt && (
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                          <Check className="w-5 h-5 text-indigo-600" />
                        </motion.div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};