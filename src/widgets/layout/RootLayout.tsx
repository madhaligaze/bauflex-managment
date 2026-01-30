import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, LayoutDashboard, FileText, Settings, LogOut, Bell, User } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/Button';

// Моковые пункты меню (потом вынесем в конфиг)
const MENU_ITEMS = [
  { icon: <LayoutDashboard size={20} />, label: 'Панель управления', path: '/' },
  { icon: <FileText size={20} />, label: 'Отчеты', path: '/reports' },
  { icon: <Settings size={20} />, label: 'Настройки', path: '/settings' },
];

export const RootLayout = () => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  // Закрываем меню при переходе на другую страницу (для мобилок)
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-slate-50 flex">
      
      {/* --- SIDEBAR (Desktop & Mobile) --- */}
      {/* Мобильный оверлей (затемнение) */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Сам Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-full w-64 bg-white border-r border-slate-200 shadow-xl transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:shadow-none",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-full flex-col">
          {/* Логотип */}
          <div className="flex h-16 items-center border-b border-slate-100 px-6">
            <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center mr-3">
              <span className="text-white font-bold">B</span>
            </div>
            <span className="text-xl font-bold text-slate-800">BAUFLEX</span>
            <button 
              onClick={() => setSidebarOpen(false)} 
              className="ml-auto lg:hidden text-slate-400"
            >
              <X />
            </button>
          </div>

          {/* Навигация */}
          <nav className="flex-1 space-y-1 px-3 py-4">
            {MENU_ITEMS.map((item) => (
              <a
                key={item.path}
                href={item.path} // Временно href, потом заменим на Link
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  location.pathname === item.path
                    ? "bg-indigo-50 text-indigo-600"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                )}
              >
                {item.icon}
                {item.label}
              </a>
            ))}
          </nav>

          {/* Футер сайдбара */}
          <div className="border-t border-slate-100 p-4">
            <Button variant="ghost" size="sm" className="w-full justify-start text-red-500 hover:bg-red-50 hover:text-red-600">
              <LogOut size={18} className="mr-2" />
              Выйти
            </Button>
          </div>
        </div>
      </aside>

      {/* --- MAIN CONTENT --- */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white/80 px-4 backdrop-blur-md sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="text-slate-500 hover:text-slate-700 lg:hidden"
            >
              <Menu />
            </button>
            <h1 className="text-lg font-semibold text-slate-800 lg:hidden">
              BAUFLEX
            </h1>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
             {/* Пример иконок справа */}
            <Button variant="ghost" size="icon" className="text-slate-500">
              <Bell size={20} />
            </Button>
            <div className="h-8 w-8 rounded-full bg-indigo-100 border border-indigo-200 flex items-center justify-center text-indigo-700 font-medium cursor-pointer">
              <User size={16} />
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
           <Outlet /> {/* Здесь будут рендериться наши страницы */}
        </main>
      </div>
    </div>
  );
};