import { useState, useRef, useEffect } from 'react';
import { User, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AutocompleteProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  className?: string;
}

export const Autocomplete = ({ 
  label, 
  value, 
  onChange, 
  options, 
  placeholder = 'Начните вводить ФИО...',
  className = ''
}: AutocompleteProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const containerRef = useRef<HTMLDivElement>(null);

  // Фильтрация опций на основе ввода
  const filteredOptions = options.filter(option =>
    option.toLowerCase().includes(inputValue.toLowerCase())
  );

  // Закрытие при клике вне компонента
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Синхронизация с пропсом value
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    onChange(newValue);
    setIsOpen(true);
  };

  const handleSelectOption = (option: string) => {
    setInputValue(option);
    onChange(option);
    setIsOpen(false);
  };

  const handleInputFocus = () => {
    setIsOpen(true);
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Label */}
      {label && (
        <label className="block text-xs font-semibold text-white/60 mb-2 ml-1 uppercase tracking-wide">
          {label}
        </label>
      )}

      {/* Input Container */}
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none z-10">
          <User size={18} />
        </div>
        
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          placeholder={placeholder}
          className="w-full h-14 bg-white/5 border border-white/10 rounded-xl pl-16 pr-12 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
          autoComplete="off"
        />

        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors z-10"
        >
          <ChevronDown 
            size={18} 
            className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          />
        </button>
      </div>

      {/* Dropdown Options */}
      <AnimatePresence>
        {isOpen && filteredOptions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 w-full mt-2 bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden"
          >
            <div className="max-h-60 overflow-y-auto custom-scrollbar">
              {filteredOptions.map((option, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleSelectOption(option)}
                  className="w-full px-4 py-3 text-left text-white/90 hover:bg-indigo-500/20 hover:text-white transition-colors border-b border-white/5 last:border-0 flex items-center gap-3 group"
                >
                  <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/40 group-hover:bg-indigo-500/30 group-hover:text-indigo-300 transition-colors">
                    <User size={16} />
                  </div>
                  <span className="text-sm font-medium">{option}</span>
                </button>
              ))}
            </div>
            
            {/* Hint внизу списка */}
            <div className="px-4 py-2 bg-white/5 border-t border-white/10 text-xs text-white/40 text-center">
              Выберите из списка или введите вручную
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* No results message */}
      {isOpen && inputValue && filteredOptions.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="absolute z-50 w-full mt-2 bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl p-4"
        >
          <div className="text-center text-white/40 text-sm">
            <div className="mb-2">Сотрудник не найден в базе</div>
            <div className="text-xs text-white/30">Имя будет добавлено вручную: <span className="text-indigo-400 font-semibold">"{inputValue}"</span></div>
          </div>
        </motion.div>
      )}
    </div>
  );
};