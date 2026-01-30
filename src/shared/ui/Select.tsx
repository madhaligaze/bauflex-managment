import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

export const PremiumSelect = ({ label, options, value, onChange }: any) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="flex flex-col gap-2 w-full">
      <span className="text-[11px] font-medium text-premium-muted uppercase tracking-[0.1em] ml-1">
        {label}
      </span>
      
      {/* Trigger */}
      <button
        onClick={() => setIsOpen(true)}
        className="h-14 w-full flex items-center justify-between px-5 bg-premium-surface border border-premium-border rounded-premium hover:border-premium-text transition-all duration-300"
      >
        <span className={value ? "text-premium-text" : "text-premium-muted"}>
          {value || "Выбрать..."}
        </span>
        <ChevronDown size={16} className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Mobile Drawer & Desktop Popover */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-[60]"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 bg-white z-[70] rounded-t-[32px] p-8 pb-12 shadow-2xl md:absolute md:bottom-auto md:top-full md:rounded-premium md:p-2 md:mt-2"
            >
              <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-8 md:hidden" />
              <div className="flex flex-col gap-1">
                {options.map((opt: string) => (
                  <button
                    key={opt}
                    onClick={() => { onChange(opt); setIsOpen(false); }}
                    className="h-14 md:h-10 w-full flex items-center px-4 rounded-xl hover:bg-gray-50 text-premium-text font-medium transition-colors"
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};