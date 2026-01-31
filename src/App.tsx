import { useState, useEffect } from 'react';
import { ProcurementWidget } from '@/widgets/procurement/ProcurementWidget';
import { BrandLogo } from '@/shared/ui/BrandLogo';
import { AdminPanelWidget } from '@/widgets/admin/AdminPanelWidget';
import { LoginModal } from '@/features/auth/ui/LoginModal'; 
import { motion, AnimatePresence } from 'framer-motion';
import { useBauflexStore } from '@/entities/request/model/store'; 
import { LogOut } from 'lucide-react'; 

function App() {
  const [viewMode, setViewMode] = useState<'user' | 'admin'>('user');
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  // --- ВОССТАНОВЛЕНИЕ СЕССИИ ---
  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');

    if (token && role === 'ADMIN') {
      setIsAuthorized(true);
      // Если есть токен, не переключаем принудительно, 
      // чтобы пользователь сам решал, куда ему нужно (или можно раскомментировать)
      // setViewMode('admin'); 
    }
  }, []);

  // --- ИНИЦИАЛИЗАЦИЯ ДАННЫХ ---
  useEffect(() => {
    const store = useBauflexStore.getState();
    store.fetchEmployees();

    if (viewMode === 'admin') {
      store.fetchRequests();
    }
  }, [viewMode]);

  // --- ЛОГИКА АВТОРИЗАЦИИ И ВЫХОДА ---
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    setIsAuthorized(false);
    setViewMode('user');
  };

  const handleToggleAdmin = () => {
    if (viewMode === 'user') {
      if (isAuthorized) {
        setViewMode('admin');
      } else {
        setIsLoginOpen(true);
      }
    } else {
      setViewMode('user');
    }
  };

  return (
    <div className="relative min-h-screen w-full font-sans overflow-x-hidden selection:bg-indigo-100 bg-slate-950">
      
      {/* --- ГЛОБАЛЬНЫЙ ФОН --- */}
      <div className="fixed inset-0 z-0 overflow-hidden">
        <video 
          autoPlay loop muted playsInline 
          className="w-full h-full object-cover scale-100 opacity-80" 
          style={{ filter: 'brightness(0.8) contrast(1.1)' }}
          onError={(e) => {
            // Fallback если видео не загрузилось
            e.currentTarget.style.display = 'none';
          }}
        >
          <source src="https://kgiabptsnckcwqjeeztj.supabase.co/storage/v1/object/public/background/8WMyJX4AMulUjd5lRfWR+F_B0yx-4I2Y.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/10 via-transparent to-slate-950/40" /> 
      </div>

      {/* --- HEADER --- */}
      <header className="sticky top-0 z-50 w-full bg-white/5 border-b border-white/5">
        <div className="max-w-5xl mx-auto px-6 h-16 md:h-20 flex items-center justify-between">
          <BrandLogo />
          <div className="flex items-center gap-4">
            
            {/* Кнопка выхода в хедере (дублирующая, опционально) */}
            {isAuthorized && (
              <button 
                onClick={handleLogout}
                className="hidden md:flex w-10 h-10 rounded-full border border-white/10 bg-white/5 text-white/60 hover:text-white hover:bg-white/10 transition-all items-center justify-center"
                title="Выйти из системы"
              >
                <LogOut size={18} />
              </button>
            )}

            {/* Тоггл Админки */}
            <button 
              onClick={handleToggleAdmin}
              className={`w-9 h-9 md:w-10 md:h-10 rounded-full border transition-all duration-500 flex items-center justify-center shadow-2xl backdrop-blur-md
                ${viewMode === 'admin' 
                  ? 'bg-red-600 border-red-500 text-white scale-110' 
                  : 'bg-white/5 border-white/10 text-white hover:bg-white/20'}`}
            >
              <span className="font-bold text-sm md:text-base">A</span>
            </button>
          </div>
        </div>
      </header>

      {/* --- ОСНОВНОЙ КОНТЕНТ --- */}
      <main className="relative z-10 max-w-5xl mx-auto p-4 pt-6 md:p-6 md:pt-12">
        <AnimatePresence mode="wait">
          {viewMode === 'user' ? (
            <motion.div 
              key="user-view"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <div className="mb-8 md:mb-12 relative flex justify-center md:justify-start">
                <div className="inline-block relative p-4 md:p-6 rounded-[24px] overflow-hidden">
                  <div className="absolute inset-0 bg-white/[0.02] border border-white/10 rounded-[24px]" />
                  <div className="relative z-10 text-center md:text-left">
                    <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">Заполнение форм</h1>
                    <p className="text-indigo-100/60 mt-1 text-xs md:text-sm font-medium">Создание новой заявки</p>
                  </div>
                </div>
              </div>
              <ProcurementWidget />
            </motion.div>
          ) : (
            <motion.div 
              key="admin-view"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <div className="mb-8 md:mb-12 relative flex justify-center md:justify-start">
                <div className="inline-block relative p-4 md:p-6 rounded-[24px] overflow-hidden">
                  <div className="absolute inset-0 bg-red-500/5 border border-red-500/20 rounded-[24px]" />
                  <div className="relative z-10 text-center md:text-left">
                    <h1 className="text-xl md:text-2xl font-bold text-red-500 tracking-tight uppercase">Admin Panel</h1>
                    <p className="text-white/60 mt-1 text-xs md:text-sm font-medium tracking-wide">Управление и экспорт заявок</p>
                  </div>
                </div>
              </div>
              
              {/* ПЕРЕДАЕМ onLogout */}
              <AdminPanelWidget onLogout={handleLogout} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* --- МОДАЛКА ВХОДА --- */}
      <LoginModal 
        isOpen={isLoginOpen} 
        onClose={() => setIsLoginOpen(false)} 
        onLoginSuccess={(token: string, role: string) => {
          setIsAuthorized(true);
          setViewMode('admin');
          localStorage.setItem('token', token);
          localStorage.setItem('role', role);
        }} 
      />
    </div>
  );
}

export default App;