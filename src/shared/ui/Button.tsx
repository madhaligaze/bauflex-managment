import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/shared/lib/utils'; // Импортируем нашу общую утилиту

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, leftIcon, children, disabled, ...props }, ref) => {
    
    // Базовые стили
    const baseStyles = "inline-flex items-center justify-center rounded-xl font-medium transition-all duration-200 active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100";
    
    // Варианты (Цвета)
    const variants = {
      primary: "bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500 shadow-lg shadow-indigo-200/50 border border-transparent",
      secondary: "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:text-slate-900 focus:ring-slate-200 shadow-sm",
      ghost: "bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900",
      danger: "bg-red-50 text-red-600 hover:bg-red-100 focus:ring-red-500 border border-transparent",
      outline: "bg-transparent border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50",
    };

    // Размеры
    const sizes = {
      sm: "h-8 px-3 text-xs",
      md: "h-12 px-5 text-sm", // Чуть увеличил высоту для удобства на тач-экранах
      lg: "h-14 px-8 text-base",
      icon: "h-12 w-12 p-2",
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {!isLoading && leftIcon && <span className="mr-2">{leftIcon}</span>}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";