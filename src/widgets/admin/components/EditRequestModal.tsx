import { useState } from 'react';
import { X, Save } from 'lucide-react';
import { Modal } from '@/shared/ui/Modal';
import { Button } from '@/shared/ui/Button';
import { Input } from '@/shared/ui/Input';
import { PremiumSelect } from '@/shared/ui/PremiumSelect';
import { RequestEntry } from '@/entities/request/model/store';

interface EditRequestModalProps {
  request: RequestEntry;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<RequestEntry>) => Promise<void>;
}

const CLOTHING_SIZES = ['40-42', '42-44', '44-46', '46-48', '48-50', '50-52', '52-54', '54-56'];
const SHOE_SIZES = Array.from({ length: 10 }, (_, i) => (36 + i).toString());
const HEIGHTS = ['140-150', '150-160', '160-170', '170-180', '180-190', '190-200', '200-210', '210-220'];
const SEASONS = ['Лето', 'Зима', 'Демисезон', 'Всесезон'];

export const EditRequestModal = ({ 
  request, 
  isOpen, 
  onClose, 
  onSave 
}: EditRequestModalProps) => {
  const [isSaving, setIsSaving] = useState(false);
  const [user, setUser] = useState(request.user);
  const [status, setStatus] = useState(request.status);
  
  // Состояние для СИЗ
  const [sizDetails, setSizDetails] = useState(() => {
    if (request.type === 'siz' && request.details) {
      return request.details as any;
    }
    return {
      height: '',
      clothingSize: '',
      clothingSeason: '',
      shoeSize: '',
      shoeSeason: ''
    };
  });

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const data: Partial<RequestEntry> = {
        user,
        status,
        details: request.type === 'siz' ? sizDetails : request.details
      };
      
      await onSave(data);
    } catch (error) {
      console.error('Ошибка сохранения:', error);
      alert('Ошибка при сохранении изменений');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Редактирование заявки">
      <div className="space-y-6 p-6">
        {/* ФИО Сотрудника */}
        <div>
          <label className="block text-white/70 text-sm font-bold mb-2">
            ФИО Сотрудника
          </label>
          <Input
            value={user}
            onChange={(e) => setUser(e.target.value)}
            placeholder="Введите ФИО"
            className="bg-white/5 border-white/10 text-white"
          />
        </div>

        {/* Статус */}
        <div>
          <label className="block text-white/70 text-sm font-bold mb-2">
            Статус
          </label>
          <PremiumSelect
            value={status}
            onChange={(val) => setStatus(val as RequestEntry['status'])}
            options={[
              { value: 'Новая', label: 'Новая' },
              { value: 'В работе', label: 'В работе' },
              { value: 'Завершена', label: 'Завершена' }
            ]}
          />
        </div>

        {/* Детали СИЗ */}
        {request.type === 'siz' && (
          <div className="space-y-4 pt-4 border-t border-white/10">
            <h3 className="text-white font-bold text-sm uppercase">Размеры СИЗ</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-white/50 text-xs mb-2">Рост</label>
                <PremiumSelect
                  value={sizDetails.height}
                  onChange={(val) => setSizDetails({ ...sizDetails, height: val })}
                  options={HEIGHTS.map(h => ({ value: h, label: `${h} см` }))}
                  placeholder="Выберите рост"
                />
              </div>

              <div>
                <label className="block text-white/50 text-xs mb-2">Размер одежды</label>
                <PremiumSelect
                  value={sizDetails.clothingSize}
                  onChange={(val) => setSizDetails({ ...sizDetails, clothingSize: val })}
                  options={CLOTHING_SIZES.map(s => ({ value: s, label: s }))}
                  placeholder="Выберите размер"
                />
              </div>

              <div>
                <label className="block text-white/50 text-xs mb-2">Сезон одежды</label>
                <PremiumSelect
                  value={sizDetails.clothingSeason}
                  onChange={(val) => setSizDetails({ ...sizDetails, clothingSeason: val })}
                  options={SEASONS.map(s => ({ value: s, label: s }))}
                  placeholder="Выберите сезон"
                />
              </div>

              <div>
                <label className="block text-white/50 text-xs mb-2">Размер обуви</label>
                <PremiumSelect
                  value={sizDetails.shoeSize}
                  onChange={(val) => setSizDetails({ ...sizDetails, shoeSize: val })}
                  options={SHOE_SIZES.map(s => ({ value: s, label: s }))}
                  placeholder="Выберите размер"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-white/50 text-xs mb-2">Сезон обуви</label>
                <PremiumSelect
                  value={sizDetails.shoeSeason}
                  onChange={(val) => setSizDetails({ ...sizDetails, shoeSeason: val })}
                  options={SEASONS.map(s => ({ value: s, label: s }))}
                  placeholder="Выберите сезон"
                />
              </div>
            </div>
          </div>
        )}

        {/* Кнопки */}
        <div className="flex gap-3 pt-4">
          <Button
            onClick={onClose}
            variant="secondary"
            className="flex-1 bg-white/5 hover:bg-white/10"
            disabled={isSaving}
          >
            <X size={16} className="mr-2" />
            Отмена
          </Button>
          
          <Button
            onClick={handleSave}
            className="flex-1 bg-green-600 hover:bg-green-500"
            disabled={isSaving}
          >
            <Save size={16} className="mr-2" />
            {isSaving ? 'Сохранение...' : 'Сохранить'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
