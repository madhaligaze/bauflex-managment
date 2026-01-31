import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className, 
    variant = 'primary', 
    size = 'md', 
    isLoading, 
    leftIcon, 
    children, 
    disabled, 
    ...props 
  }, ref) => {
    
    // Базовые стили с улучшенной визуальной иерархией
    const baseStyles = "inline-flex items-center justify-center rounded-xl font-semibold transition-all duration-200 focus:outline-none focus:ring-4 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 active:scale-95 relative overflow-hidden group";
    
    // Варианты стилей - адаптированные под темную тему с сохранением оригинальной логики
    const variants = {
      primary: "bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-600 text-white border border-red-400/20 shadow-lg shadow-red-500/20 hover:shadow-xl hover:shadow-red-500/30 focus:ring-red-500/30",
      secondary: "bg-white/5 hover:bg-white/10 text-white border border-white/10 hover:border-white/20 focus:ring-white/10 backdrop-blur-xl shadow-sm",
      ghost: "bg-transparent text-white/80 hover:bg-white/5 hover:text-white border border-transparent hover:border-white/10 focus:ring-white/10",
      danger: "bg-red-500/20 text-red-300 hover:bg-red-500/30 border border-red-500/30 hover:border-red-500/40 focus:ring-red-500/20",
      outline: "bg-transparent border-2 border-red-500 text-red-400 hover:bg-red-500/10 hover:border-red-400 focus:ring-red-500/20",
    };
    
    // Размеры - сохраняем оригинальные
    const sizes = {
      sm: "h-8 px-3 text-xs",
      md: "h-12 px-5 text-sm",
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
        {/* Shimmer эффект для primary кнопок */}
        {variant === 'primary' && !disabled && !isLoading && (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000 pointer-events-none" />
        )}
        
        {/* Loading индикатор */}
        {isLoading && (
          <Loader2 className="mr-2 h-4 w-4 animate-spin relative z-10" />
        )}
        
        {/* Left иконка */}
        {!isLoading && leftIcon && (
          <span className="mr-2 relative z-10">{leftIcon}</span>
        )}
        
        {/* Контент */}
        <span className="relative z-10">{children}</span>
      </button>
    );
  }
);

Button.displayName = "Button";
