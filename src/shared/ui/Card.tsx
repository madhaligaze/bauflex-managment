import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/shared/lib/utils';

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  gradient?: boolean;
  noPadding?: boolean;
}

export const Card = ({ 
  children, 
  className, 
  hover = false,
  gradient = false,
  noPadding = false
}: CardProps) => {
  const CardComponent = hover ? motion.div : 'div';
  
  return (
    <CardComponent
      {...(hover && {
        whileHover: { scale: 1.02, y: -4 },
        transition: { type: "spring", stiffness: 300, damping: 20 }
      })}
      className={cn(
        "rounded-2xl border border-white/10 backdrop-blur-xl relative overflow-hidden",
        gradient 
          ? "bg-gradient-to-br from-white/[0.07] to-white/[0.03]" 
          : "bg-white/[0.02]",
        !noPadding && "p-6",
        hover && "cursor-pointer transition-shadow hover:shadow-xl hover:shadow-black/20",
        className
      )}
    >
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')]" />
      </div>
      
      <div className="relative z-10">
        {children}
      </div>
    </CardComponent>
  );
};
