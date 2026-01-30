// src/shared/ui/Input.tsx
import React from 'react';
import { cn } from '@/shared/lib/utils';

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement> & { label?: string }>(
  ({ className, label, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-2 w-full">
        {label && (
          <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest ml-1">
            {label}
          </span>
        )}
        <input
          ref={ref}
          className={cn(
            "h-14 w-full rounded-2xl px-5 text-base transition-all duration-300",
            "bg-white/5 border border-white/10 text-white placeholder:text-white/20",
            // ИЗМЕНЕНИЕ: Вместо focus:bg-white делаем легкое высветление
            "focus:bg-white/10 focus:border-red-500/50 focus:ring-4 focus:ring-red-500/10 focus:outline-none",
            className
          )}
          {...props}
        />
      </div>
    );
  }
);
Input.displayName = "Input";