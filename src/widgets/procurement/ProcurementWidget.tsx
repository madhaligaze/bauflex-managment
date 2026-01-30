import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Plus, Minus, HardHat, Wrench, Truck, Package, Trash2 } from 'lucide-react';

// UI Components
import { Button } from '@/shared/ui/Button';
import { Input } from '@/shared/ui/Input';
import { Card } from '@/shared/ui/Card';
import { Modal } from '@/shared/ui/Modal';
import { PremiumSelect } from '@/shared/ui/PremiumSelect';

// Store
import { useBauflexStore } from '@/entities/request/model/store';

// --- Types ---
type ViewState = 'menu' | 'siz' | 'tools' | 'equipment' | 'consumables';

interface Item {
  id: number;
  name: string;
  qty: number;
}

// --- Data Constants ---
const CLOTHING_SIZES = ['40-42', '42-44', '44-46', '46-48', '48-50', '50-52', '52-54', '54-56'];
const SHOE_SIZES = Array.from({ length: 10 }, (_, i) => (36 + i).toString());
const HEIGHTS = ['140-150', '150-160', '160-170', '170-180', '180-190', '190-200', '200-210', '210-220'];

export const ProcurementWidget = () => {
  const [view, setView] = useState<ViewState>('menu');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // --- STORE INTEGRATION ---
  // Получаем функцию добавления и список сотрудников
  const { addRequest, employees } = useBauflexStore((state: any) => state);

  // Состояние выбранного сотрудника (единое для всех форм)
  const [selectedEmployee, setSelectedEmployee] = useState('');

  const [sizForm, setSizForm] = useState({
    clothingSeason: '',
    shoeSeason: '',
    height: '',
    clothingSize: '',
    shoeSize: '',
  });

  const [items, setItems] = useState<Item[]>([{ id: Date.now(), name: '', qty: 1 }]);

  // --- Logic ---
  const totalItems = items.length;
  const totalQuantity = useMemo(() => {
    return items.reduce((sum, item) => sum + (item.qty || 0), 0);
  }, [items]);

  const handleAddItem = () => {
    setItems([...items, { id: Date.now(), name: '', qty: 1 }]);
  };

  const handleRemoveItem = (id: number) => {
    if (items.length > 1) {
      setItems(items.filter((item) => item.id !== id));
    }
  };

  const handleUpdateItem = (id: number, field: keyof Item, value: string | number) => {
    setItems(
      items.map((item) => {
        if (item.id === id) {
          if (field === 'qty') {
            const newQty = Math.max(1, Number(value));
            return { ...item, qty: newQty };
          }
          return { ...item, [field]: String(value) };
        }
        return item;
      })
    );
  };

  const handleConfirm = () => {
    // Валидация: сотрудник должен быть выбран
    if (!selectedEmployee) {
      alert('Пожалуйста, выберите сотрудника из списка.');
      setIsModalOpen(false);
      return;
    }

    const details = view === 'siz' ? sizForm : items;

    addRequest({
      type: view,
      user: selectedEmployee, // Используем выбранного из базы сотрудника
      details: details,
    });

    setIsModalOpen(false);
    setView('menu');
    
    // Сброс форм
    setItems([{ id: Date.now(), name: '', qty: 1 }]);
    setSelectedEmployee('');
    setSizForm({ 
      clothingSeason: '', 
      shoeSeason: '', 
      height: '', 
      clothingSize: '', 
      shoeSize: '' 
    });
  };

  // --- VIEW: MENU ---
  if (view === 'menu') {
    const menuItems = [
      { id: 'siz', label: 'СИЗ', icon: HardHat, color: 'bg-blue-50 text-blue-600' },
      { id: 'tools', label: 'Инструменты', icon: Wrench, color: 'bg-amber-50 text-amber-600' },
      { id: 'equipment', label: 'Оборудование', icon: Truck, color: 'bg-indigo-50 text-indigo-600' },
      { id: 'consumables', label: 'Расходники', icon: Package, color: 'bg-emerald-50 text-emerald-600' },
    ];

    return (
      <div className="grid grid-cols-2 gap-6 max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-700">
        {menuItems.map((item) => (
          <motion.button
            key={item.id}
            whileHover={{ scale: 1.03, y: -5 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setView(item.id as ViewState)}
            className="relative overflow-hidden flex flex-col items-center justify-center p-8 h-48 bg-white/30 backdrop-blur-2xl rounded-[40px] border border-white/40 shadow-[0_8px_32px_rgba(0,0,0,0.05)] hover:bg-white/50 transition-all group"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent pointer-events-none" />
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-5 transition-all duration-500 group-hover:scale-110 ${item.color} shadow-inner`}>
              <item.icon size={32} />
            </div>
            <span className="font-bold text-slate-800 text-lg tracking-tight">{item.label}</span>
          </motion.button>
        ))}
      </div>
    );
  }

  // --- VIEW: FORM ---
  return (
    <div className="max-w-lg mx-auto pb-10">
      <div className="flex items-center gap-4 mb-6 px-2">
        <button
          onClick={() => setView('menu')}
          className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 transition-colors shadow-sm"
        >
          <ChevronLeft size={20} />
        </button>
        <h2 className="text-2xl font-bold text-white drop-shadow-sm">
          {{ siz: 'Заявка на СИЗ', tools: 'Инструменты', equipment: 'Оборудование', consumables: 'Расходники' }[view]}
        </h2>
      </div>

      <Card className="bg-white/10 backdrop-blur-2xl border border-white/20 shadow-2xl p-6 overflow-visible">
        
        {/* --- ВЫБОР СОТРУДНИКА (ОБЩИЙ ДЛЯ ВСЕХ ФОРМ) --- */}
        <div className="mb-6">
           <PremiumSelect
            label="Выберите сотрудника"
            options={employees.map((e: any) => e.fullName)} // Мапим массив объектов в массив строк имен
            value={selectedEmployee}
            onChange={setSelectedEmployee}
          />
        </div>

        {view === 'siz' ? (
          <div className="space-y-5">
            {/* Старый Input для имени удален, теперь используется PremiumSelect выше */}
            
            <div className="grid grid-cols-2 gap-4">
              <PremiumSelect
                label="Сезон одежды"
                options={['Летний', 'Зимний']}
                value={sizForm.clothingSeason}
                onChange={(v) => setSizForm({ ...sizForm, clothingSeason: v })}
              />
              <PremiumSelect
                label="Сезон обуви"
                options={['Летний', 'Зимний']}
                value={sizForm.shoeSeason}
                onChange={(v) => setSizForm({ ...sizForm, shoeSeason: v })}
              />
            </div>

            <PremiumSelect
              label="Рост (см)"
              options={HEIGHTS}
              value={sizForm.height}
              onChange={(v) => setSizForm({ ...sizForm, height: v })}
            />

            <div className="grid grid-cols-2 gap-4">
              <PremiumSelect
                label="Размер одежды"
                options={CLOTHING_SIZES}
                value={sizForm.clothingSize}
                onChange={(v) => setSizForm({ ...sizForm, clothingSize: v })}
              />
              <PremiumSelect
                label="Размер обуви"
                options={SHOE_SIZES}
                value={sizForm.shoeSize}
                onChange={(v) => setSizForm({ ...sizForm, shoeSize: v })}
              />
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-2 text-white">
              <h3 className="text-sm font-bold opacity-40 uppercase tracking-widest">Позиции</h3>
              <div className="flex gap-2">
                <span className="px-3 py-1 bg-white/5 rounded-full text-[10px] font-black opacity-70 border border-white/10">
                  Рядов: {totalItems}
                </span>
                <span className="px-3 py-1 bg-indigo-500/20 rounded-full text-[10px] font-black border border-indigo-500/30">
                  Всего ед: {totalQuantity}
                </span>
              </div>
            </div>

            <div className="space-y-4">
              <AnimatePresence mode="popLayout">
                {items.map((item, index) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="flex gap-3 items-end"
                  >
                    <div className="flex-1">
                      <Input
                        label={index === 0 ? 'Наименование' : undefined}
                        placeholder="Что нужно?"
                        value={item.name}
                        onChange={(e) => handleUpdateItem(item.id, 'name', e.target.value)}
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      {index === 0 && (
                        <span className="text-xs font-semibold text-white/50 uppercase tracking-wide text-center">Кол-во</span>
                      )}
                      <div className="h-14 flex items-center bg-white/5 border border-white/10 rounded-xl px-2 text-white">
                        <button
                          type="button"
                          onClick={() => handleUpdateItem(item.id, 'qty', item.qty - 1)}
                          className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded-lg transition-all"
                        >
                          <Minus size={16} />
                        </button>
                        <span className="w-10 text-center font-semibold">{item.qty}</span>
                        <button
                          type="button"
                          onClick={() => handleUpdateItem(item.id, 'qty', item.qty + 1)}
                          className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded-lg transition-all"
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                    </div>
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.id)}
                        className="h-14 w-10 flex items-center justify-center text-white/20 hover:text-red-400 transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            <button
              type="button"
              onClick={handleAddItem}
              className="w-full py-4 border-2 border-dashed border-white/10 rounded-xl text-white/30 hover:border-indigo-500/50 hover:text-indigo-300 hover:bg-indigo-500/5 transition-all flex items-center justify-center gap-2 font-medium"
            >
              <Plus size={20} /> Добавить позицию
            </button>
          </div>
        )}

        <div className="pt-8 mt-4 border-t border-white/5">
          <Button 
            className="w-full h-14 text-lg bg-indigo-600 hover:bg-indigo-500 shadow-xl shadow-indigo-500/20" 
            onClick={() => setIsModalOpen(true)}
          >
            Отправить заявку
          </Button>
        </div>
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleConfirm}
        title="Отправка заявки"
        description={`Заявка будет оформлена на сотрудника: ${selectedEmployee}`}
      />
    </div>
  );
};