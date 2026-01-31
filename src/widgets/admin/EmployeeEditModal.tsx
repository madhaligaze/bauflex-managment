import { useState, useEffect } from 'react';
import { Modal } from '@/shared/ui/Modal';
import { Input } from '@/shared/ui/Input';
import { PremiumSelect } from '@/shared/ui/PremiumSelect';
import { Button } from '@/shared/ui/Button';
import { User, Briefcase, Mail, Phone, Building2, Ruler, Footprints } from 'lucide-react';

interface Employee {
  id: string;
  fullName: string;
  department: string;
  position?: string;
  email?: string;
  phone?: string;
  clothingSize?: string;
  shoeSize?: string;
  height?: string;
}

interface EmployeeEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee | null;
  onSave: (data: Partial<Employee>) => void;
}

const CLOTHING_SIZES = ['40-42', '42-44', '44-46', '46-48', '48-50', '50-52', '52-54', '54-56'];
const SHOE_SIZES = Array.from({ length: 10 }, (_, i) => (36 + i).toString());
const HEIGHTS = ['140-150', '150-160', '160-170', '170-180', '180-190', '190-200', '200-210', '210-220'];

export const EmployeeEditModal = ({ isOpen, onClose, employee, onSave }: EmployeeEditModalProps) => {
  const [formData, setFormData] = useState<Partial<Employee>>({
    fullName: '',
    department: '',
    position: '',
    email: '',
    phone: '',
    clothingSize: '',
    shoeSize: '',
    height: ''
  });

  useEffect(() => {
    if (employee) {
      setFormData(employee);
    }
  }, [employee]);

  const handleSubmit = () => {
    if (!formData.fullName || !formData.department) {
      alert('Заполните обязательные поля: ФИО и Отдел');
      return;
    }
    onSave(formData);
    onClose();
  };

  const updateField = (field: keyof Employee, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={employee ? 'Редактировать сотрудника' : 'Добавить сотрудника'}
      description="Заполните информацию о сотруднике"
    >
      <div className="mt-6 space-y-5 max-h-[60vh] overflow-y-auto custom-scrollbar pr-2">
        
        {/* Основная информация */}
        <div className="space-y-4">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
            <User size={14} />
            <span>Основная информация</span>
          </div>
          
          <Input
            label="ФИО *"
            placeholder="Иванов Иван Иванович"
            value={formData.fullName || ''}
            onChange={(e) => updateField('fullName', e.target.value)}
            className="bg-slate-900/90 border-white/10 text-white"
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Отдел *"
              placeholder="Производство"
              value={formData.department || ''}
              onChange={(e) => updateField('department', e.target.value)}
              className="bg-slate-900/90 border-white/10 text-white"
            />
            
            <Input
              label="Должность"
              placeholder="Инженер"
              value={formData.position || ''}
              onChange={(e) => updateField('position', e.target.value)}
              className="bg-slate-900/90 border-white/10 text-white"
            />
          </div>
        </div>

        {/* Контакты */}
        <div className="space-y-4 pt-4 border-t border-white/5">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
            <Mail size={14} />
            <span>Контактные данные</span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Email"
              type="email"
              placeholder="ivanov@company.com"
              value={formData.email || ''}
              onChange={(e) => updateField('email', e.target.value)}
              className="bg-slate-900/90 border-white/10 text-white"
            />
            
            <Input
              label="Телефон"
              type="tel"
              placeholder="+7 (___) ___-__-__"
              value={formData.phone || ''}
              onChange={(e) => updateField('phone', e.target.value)}
              className="bg-slate-900/90 border-white/10 text-white"
            />
          </div>
        </div>

        {/* Размеры для СИЗ */}
        <div className="space-y-4 pt-4 border-t border-white/5">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
            <Ruler size={14} />
            <span>Размеры (для заявок на СИЗ)</span>
          </div>

          <PremiumSelect
            label="Рост"
            options={HEIGHTS}
            value={formData.height || ''}
            onChange={(v) => updateField('height', v)}
          />

          <div className="grid grid-cols-2 gap-4">
            <PremiumSelect
              label="Размер одежды"
              options={CLOTHING_SIZES}
              value={formData.clothingSize || ''}
              onChange={(v) => updateField('clothingSize', v)}
            />
            
            <PremiumSelect
              label="Размер обуви"
              options={SHOE_SIZES}
              value={formData.shoeSize || ''}
              onChange={(v) => updateField('shoeSize', v)}
            />
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-6 pt-6 border-t border-white/10 flex gap-3">
        <Button
          onClick={onClose}
          variant="secondary"
          className="flex-1 bg-white/5 border-white/10 text-white/70 hover:bg-white/10"
        >
          Отмена
        </Button>
        <Button
          onClick={handleSubmit}
          className="flex-1 bg-indigo-600 hover:bg-indigo-500"
        >
          Сохранить
        </Button>
      </div>
    </Modal>
  );
};
