import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Package, LayoutDashboard, Settings, PlusCircle } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

const MENU_ITEMS = [
  { icon: LayoutDashboard, label: 'Обзор', active: true },
  { icon: Package, label: 'Заявки', active: false },
  { icon: Settings, label: 'Настройки', active: false },
];

export const MainLayout = ({ children }: { children: React.ReactNode }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 flex overflow-hidden">
      {/* --- DESKTOP SIDEBAR --- */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-100 p-6 z-20 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
        <div className="flex items-center gap-2 mb-10">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">B</span>
          </div>
          <span className="text-xl font-bold text-gray-900 tracking-tight">BAUFLEX</span>
        </div>

        <nav className="flex flex-col gap-2">
          {MENU_ITEMS.map((item) => (
            <button
              key={item.label}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300",
                item.active 
                  ? "bg-indigo-50 text-indigo-700 shadow-sm" 
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <item.icon size={20} className={item.active ? "text-indigo-600" : "text-gray-400"} />
              {item.label}
            </button>
          ))}
        </nav>
      </aside>

      {/* --- MOBILE HEADER & MENU --- */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-md z-30 flex items-center justify-between px-4 border-b border-gray-100">
         <span className="text-lg font-bold text-gray-900">BAUFLEX</span>
         <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-gray-600">
           {isMobileMenuOpen ? <X /> : <Menu />}
         </button>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 bg-white z-20 pt-20 px-6 md:hidden"
          >
             <nav className="flex flex-col gap-4">
              {MENU_ITEMS.map((item) => (
                <button key={item.label} className="flex items-center gap-4 p-4 text-lg font-medium text-gray-700 border-b border-gray-50">
                  <item.icon size={24} />
                  {item.label}
                </button>
              ))}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- MAIN CONTENT AREA --- */}
      <main className="flex-1 relative overflow-y-auto h-screen md:p-8 p-4 pt-20 md:pt-8 scroll-smooth">
        <div className="max-w-5xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};