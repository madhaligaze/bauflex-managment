import { useState } from 'react';
import { User, Eye, EyeOff, Key, ShieldAlert, ArrowLeft } from 'lucide-react';
import { Modal } from '@/shared/ui/Modal';
import { Input } from '@/shared/ui/Input';
import { Button } from '@/shared/ui/Button';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (token: string, role: string) => void;
}

export const LoginModal = ({ isOpen, onClose, onLoginSuccess }: LoginModalProps) => {
  const [mode, setMode] = useState<'login' | 'forgot'>('login');
  const [loading, setLoading] = useState(false);
  
  // Данные для входа
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Данные для восстановления
  const [recoveryData, setRecoveryData] = useState({
    login: '',
    secretKey: '',
    newPassword: ''
  });

  const handleClose = () => {
    onClose();
    setTimeout(() => {
      setMode('login');
      setLogin('');
      setPassword('');
      setRecoveryData({ login: '', secretKey: '', newPassword: '' });
    }, 300);
  };

  // --- ОБНОВЛЕННЫЙ МЕТОД ВХОДА ---
  const handleLogin = async () => {
    if (!login || !password) return;
    setLoading(true);
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login, password })
      });

      const data = await response.json();

      if (response.ok) {
        // Вызываем onLoginSuccess с токеном и ролью
        onLoginSuccess(data.token, data.role);
        handleClose();
      } else {
        alert(data.message || 'Ошибка входа');
      }
    } catch (error) {
      console.error(error);
      alert('Ошибка соединения с сервером');
    } finally {
      setLoading(false);
    }
  };

  const handleRecovery = async () => {
    if (!recoveryData.login || !recoveryData.secretKey || !recoveryData.newPassword) {
      alert('Заполните все поля для восстановления');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/auth/reset-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(recoveryData)
      });

      if (response.ok) {
        alert('Пароль успешно изменен. Используйте новые данные для входа.');
        setMode('login');
        setRecoveryData({ login: '', secretKey: '', newPassword: '' });
      } else {
        alert('Ошибка: неверный Master Key');
      }
    } catch (e) {
      alert('Ошибка соединения с сервером');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={handleClose} 
      title={mode === 'login' ? "Вход в систему" : "Сброс доступа"}
      description={mode === 'login' 
        ? "Введите данные для управления BAUFLEX management" 
        : "Используйте Master Key для экстренной смены пароля"}
    >
      <div className="mt-6">
        {mode === 'login' ? (
          <div className="space-y-5">
            {/* --- ПОЛЯ ВВОДА --- */}
            
            {/* Логин */}
            <div className="relative">
              <Input 
                label="Логин администратора" 
                placeholder="admin" 
                value={login} 
                onChange={e => setLogin(e.target.value)} 
                className="bg-slate-900/90 border-white/10 text-white placeholder:text-white/20 focus:bg-slate-800" 
              />
              <User className="absolute right-4 top-[42px] text-white/20" size={20} />
            </div>

            {/* Пароль */}
            <div className="relative">
              <Input 
                label="Пароль" 
                type={showPassword ? "text" : "password"} 
                placeholder="••••••••" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                className="bg-slate-900/90 border-white/10 text-white placeholder:text-white/20 focus:bg-slate-800 pr-12" 
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-[42px] text-white/30 hover:text-white"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            {/* --- БЛОК КНОПОК --- */}
            <div className="pt-2"> 
                {/* Одна кнопка "Войти" */}
                <Button 
                  onClick={handleLogin}
                  isLoading={loading}
                  className="w-full bg-red-600 hover:bg-red-500 shadow-xl shadow-red-600/20 text-white font-bold h-12"
                >
                  Войти
                </Button>

                {/* Ссылка "Забыли пароль?" */}
                <div className="flex justify-center mt-6"> 
                  <button 
                    onClick={() => setMode('forgot')}
                    className="text-[10px] text-slate-400 hover:text-red-500 uppercase tracking-[0.2em] transition-colors font-bold pb-1 border-b border-transparent hover:border-red-500/30"
                  >
                    Забыли пароль?
                  </button>
                </div>
            </div>
          </div>
        ) : (
          /* --- РЕЖИМ ВОССТАНОВЛЕНИЯ --- */
          <div className="space-y-4 animate-in fade-in duration-300">
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex gap-3 items-center">
               <ShieldAlert className="text-red-500 shrink-0" size={18} /> 
               <p className="text-[10px] text-red-600/80 leading-relaxed uppercase tracking-wider font-bold">
                 Требуется Master Key из настроек сервера.
               </p>
            </div>

            <Input 
               label="Логин" 
               placeholder="admin"
               value={recoveryData.login}
               onChange={e => setRecoveryData({...recoveryData, login: e.target.value})}
               className="bg-slate-900/90 border-white/10 text-white focus:bg-slate-800"
            />

            <div className="relative">
               <Input 
                 label="Master Key" 
                 type="password"
                 placeholder="Recovery Code"
                 value={recoveryData.secretKey}
                 onChange={e => setRecoveryData({...recoveryData, secretKey: e.target.value})}
                 className="bg-slate-900/90 border-white/10 text-white focus:bg-slate-800 pr-10"
               />
               <Key className="absolute right-4 top-[42px] text-white/20" size={18} />
            </div>

            <Input 
               label="Новый пароль" 
               type="password"
               placeholder="Минимум 8 символов"
               value={recoveryData.newPassword}
               onChange={e => setRecoveryData({...recoveryData, newPassword: e.target.value})}
               className="bg-slate-900/90 border-white/10 text-white focus:bg-slate-800"
            />

            <div className="pt-4 flex flex-col gap-3">
              <Button 
                className="w-full bg-indigo-600 hover:bg-indigo-500 shadow-xl shadow-indigo-600/20 h-14" 
                onClick={handleRecovery}
                isLoading={loading}
              >
                 Сбросить и обновить
              </Button>
              <button 
                onClick={() => setMode('login')}
                className="flex items-center justify-center gap-2 text-[10px] uppercase tracking-[0.2em] text-slate-400 hover:text-slate-800 transition-colors"
              >
                <ArrowLeft size={12} /> Назад к логину
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};