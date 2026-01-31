import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  label?: string;
  value: string;
  options: string[] | SelectOption[];
  onChange: (val: string) => void;
  placeholder?: string;
}

export const PremiumSelect = ({ 
  label, 
  value, 
  options, 
  onChange,
  placeholder = "Выбрать..." 
}: SelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const normalizedOptions = options.map(opt => 
    typeof opt === 'string' ? { value: opt, label: opt } : opt
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentOption = normalizedOptions.find(opt => opt.value === value);
  const displayValue = currentOption ? currentOption.label : value;

  return (
    <div className="flex flex-col gap-2 w-full relative" ref={containerRef}>
      {label && (
        <span className="text-[11px] font-bold text-white/60 uppercase tracking-widest ml-1">
          {label}
        </span>
      )}
      
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "h-14 w-full flex items-center justify-between px-5 rounded-2xl transition-all backdrop-blur-xl group",
          "bg-white/5 border border-white/10",
          "hover:bg-white/10 hover:border-white/20 active:scale-[0.99]",
          isOpen && "bg-white/10 border-red-500/50 ring-4 ring-red-500/10 shadow-lg shadow-red-500/5"
        )}
      >
        <span className={cn(
          "text-base truncate mr-2 transition-colors",
          !value ? "text-white/40" : "text-white font-medium"
        )}>
          {displayValue || placeholder}
        </span>
        <ChevronDown className={cn(
          "w-5 h-5 text-white/40 transition-all duration-300 flex-shrink-0 group-hover:text-white/60",
          isOpen && "rotate-180 text-red-400"
        )} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop with blur */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[60] md:bg-transparent md:backdrop-blur-none"
            />
            
            {/* Dropdown Content - DARK GLASSMORPHISM */}
            <motion.div
              initial={{ y: "100%", opacity: 0, scale: 0.95 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: "100%", opacity: 0, scale: 0.95 }}
              transition={{ type: "spring", damping: 28, stiffness: 300, mass: 0.8 }}
              className={cn(
                "fixed bottom-0 left-0 right-0 z-[70] max-h-[80vh] overflow-hidden flex flex-col",
                "md:absolute md:bottom-auto md:top-[calc(100%+8px)] md:left-0 md:right-0 md:max-h-72",
                // Dark glassmorphism background
                "bg-gradient-to-b from-slate-900/95 to-slate-950/98 backdrop-blur-2xl",
                "border border-white/10 shadow-2xl",
                "rounded-t-[32px] md:rounded-2xl",
                // Subtle gradient overlay
                "before:absolute before:inset-0 before:bg-gradient-to-b before:from-red-500/5 before:to-transparent before:pointer-events-none before:rounded-t-[32px] md:before:rounded-2xl"
              )}
            >
              {/* Mobile Drag Handle */}
              <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto my-4 flex-shrink-0 md:hidden" />
              
              {/* Scrollable Options */}
              <div className="flex-1 overflow-y-auto px-4 pb-8 md:p-2 md:pb-2 custom-scrollbar">
                <div className="flex flex-col gap-1">
                  {normalizedOptions.map((opt, index) => (
                    <motion.button
                      key={opt.value}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.03 }}
                      onClick={() => {
                        onChange(opt.value);
                        setIsOpen(false);
                      }}
                      className={cn(
                        "flex items-center justify-between px-6 py-4 md:px-4 md:py-3 rounded-xl text-left transition-all duration-200 group/option relative overflow-hidden",
                        value === opt.value 
                          ? "bg-red-500/20 text-red-300 font-bold border border-red-500/30" 
                          : "hover:bg-white/5 text-white/80 active:bg-white/10 border border-transparent hover:border-white/10"
                      )}
                    >
                      {/* Hover gradient effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-red-500/0 via-red-500/5 to-red-500/0 opacity-0 group-hover/option:opacity-100 transition-opacity" />
                      
                      <span className="text-base md:text-sm relative z-10">{opt.label}</span>
                      
                      {value === opt.value && (
                        <motion.div 
                          initial={{ scale: 0, rotate: -180 }} 
                          animate={{ scale: 1, rotate: 0 }}
                          className="relative z-10"
                        >
                          <Check className="w-5 h-5 text-red-400" />
                        </motion.div>
                      )}
                    </motion.button>
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
