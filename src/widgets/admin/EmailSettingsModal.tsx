import { useState } from 'react';
import { Modal } from '@/shared/ui/Modal';
import { Input } from '@/shared/ui/Input';
import { Button } from '@/shared/ui/Button';
import { Mail, CheckCircle, Loader2 } from 'lucide-react';

export const EmailSettingsModal = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
  const [email, setEmail] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSend = () => {
    setIsSending(true);
    // Имитация работы бэкенда
    setTimeout(() => {
      setIsSending(false);
      setSent(true);
      setTimeout(() => {
        setSent(false);
        onClose();
      }, 2000);
    }, 1500);
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Экспорт на почту" 
      description="Укажите адрес получателя. Система сформирует сводный отчет и отправит его в форматах PDF и Excel."
    >
      <div className="space-y-6 mt-4">
        {sent ? (
          <div className="py-10 text-center animate-in zoom-in-95 duration-300">
            <div className="w-16 h-16 bg-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={32} />
            </div>
            <p className="text-slate-900 font-bold">Отчет успешно отправлен!</p>
          </div>
        ) : (
          <>
            <Input 
              label="E-mail получателя" 
              placeholder="manager@bauflex.com" 
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
            <div className="flex flex-col gap-2">
               <span className="text-[10px] font-bold text-slate-400 uppercase">Вложения</span>
               <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex justify-between items-center">
                  <span className="text-sm font-medium">Bauflex_Full_Report.zip</span>
                  <span className="text-[10px] bg-slate-200 px-2 py-1 rounded font-bold">~2.4 MB</span>
               </div>
            </div>
            <Button 
              className="w-full h-14 bg-indigo-900" 
              onClick={handleSend}
              isLoading={isSending}
              disabled={!email.includes('@')}
            >
              Подтвердить и отправить
            </Button>
          </>
        )}
      </div>
    </Modal>
  );
};