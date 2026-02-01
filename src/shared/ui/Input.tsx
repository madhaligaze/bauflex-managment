import { InputHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/shared/lib/utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-2 w-full">
        {label && (
          <label className="text-[11px] font-bold text-white/60 uppercase tracking-widest ml-1">
            {label}
          </label>
        )}
        
        <input
          ref={ref}
          className={cn(
            "h-14 px-5 rounded-2xl transition-all backdrop-blur-xl",
            "bg-white/5 border text-white placeholder:text-white/30",
            "focus:outline-none focus:ring-4",
            error 
              ? "border-red-500/50 focus:border-red-500 focus:ring-red-500/20" 
              : "border-white/10 focus:border-red-500/50 focus:ring-red-500/10 hover:bg-white/10 hover:border-white/20",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            className
          )}
          {...props}
        />
        
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

Input.displayName = 'Input';
