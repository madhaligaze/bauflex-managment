import { SelectHTMLAttributes, forwardRef } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options: { value: string; label: string }[] | string[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, helperText, options, className, ...props }, ref) => {
    // Normalize options to consistent format
    const normalizedOptions = options.map(opt => 
      typeof opt === 'string' ? { value: opt, label: opt } : opt
    );

    return (
      <div className="flex flex-col gap-2 w-full">
        {label && (
          <label className="text-[11px] font-bold text-white/60 uppercase tracking-widest ml-1">
            {label}
          </label>
        )}
        
        <div className="relative">
          <select
            ref={ref}
            className={cn(
              "h-14 w-full px-5 pr-12 rounded-2xl transition-all backdrop-blur-xl appearance-none",
              "bg-white/5 border text-white",
              "focus:outline-none focus:ring-4 cursor-pointer",
              error 
                ? "border-red-500/50 focus:border-red-500 focus:ring-red-500/20" 
                : "border-white/10 focus:border-red-500/50 focus:ring-red-500/10 hover:bg-white/10 hover:border-white/20",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              // Style for option elements
              "[&>option]:bg-slate-900 [&>option]:text-white",
              className
            )}
            {...props}
          >
            {normalizedOptions.map((opt) => (
              <option 
                key={opt.value} 
                value={opt.value}
                className="bg-slate-900 text-white py-2"
              >
                {opt.label}
              </option>
            ))}
          </select>
          
          {/* Custom chevron icon */}
          <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-white/40">
            <ChevronDown size={20} />
          </div>
        </div>
        
        {error && (
          <p className="text-xs text-red-400 ml-1 flex items-center gap-1">
            <span className="w-1 h-1 rounded-full bg-red-400" />
            {error}
          </p>
        )}
        
        {helperText && !error && (
          <p className="text-xs text-white/40 ml-1">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';
