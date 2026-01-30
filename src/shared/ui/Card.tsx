import React from 'react';
import { cn } from '@/shared/lib/utils';

export const Card = ({ className, children }: { className?: string, children: React.ReactNode }) => {
  return (
    <div className={cn(
      "bg-white/80 backdrop-blur-xl border border-white/20 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-3xl p-5",
      className
    )}>
      {children}
    </div>
  );
};