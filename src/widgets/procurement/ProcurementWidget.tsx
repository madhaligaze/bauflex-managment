import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Plus, Minus, HardHat, Wrench, Truck, Package, Trash2, Loader2 } from 'lucide-react';

// UI Components
import { Button } from '@/shared/ui/Button';
import { Input } from '@/shared/ui/Input';
import { Card } from '@/shared/ui/Card';
import { Modal } from '@/shared/ui/Modal';
import { PremiumSelect } from '@/shared/ui/PremiumSelect';
import { Autocomplete } from '@/shared/ui/Autocomplete';

// Store
import { useBauflexStore } from '@/entities/request/model/store';
import { useToastStore } from '@/shared/ui/useToast';

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
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- STORE INTEGRATION ---
  const { addRequest, employees } = useBauflexStore((state: any) => state);
  const { success, error: showError } = useToastStore();

  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [sizForm, setSizForm] = useState({
    clothingSeason: '',
    shoeSeason: '',
    height: '',
    clothingSize: '',
    shoeSize: '',
  });

  const [items, setItems] = useState<Item[]>([{ id: Date.now(), name: '', qty: 1 }]);

  // --- Validation ---
  const validateForm = (): string | null => {
    if (!selectedEmployee || !selectedEmployee.trim()) {
      return 'Пожалуйста, выберите или введите ФИО сотрудника';
    }
    if (view === 'siz') {
      if (!sizForm.clothingSeason) return 'Выберите сезон одежды';
      if (!sizForm.shoeSeason) return 'Выберите сезон обуви';
      if (!sizForm.height) return 'Укажите рост';
      if (!sizForm.clothingSize) return 'Выберите размер одежды';
      if (!sizForm.shoeSize) return 'Выберите размер обуви';
    } else {
      const validItems = items.filter(item => item.name && item.name.trim());
      if (validItems.length === 0) return 'Добавьте хотя бы одну позицию с названием';
      const invalidItems = validItems.filter(item => !item.qty || item.qty < 1);
      if (invalidItems.length > 0) return 'Укажите корректное количество для всех позиций';
    }
    return null;
  };

  // --- Logic ---
  const totalItems = items.length;
  const totalQuantity = useMemo(() => items.reduce((sum, item) => sum + (item.qty || 0), 0), [items]);

  const handleAddItem = () => setItems([...items, { id: Date.now(), name: '', qty: 1 }]);
  
  const handleRemoveItem = (id: number) => {
    if (items.length > 1) setItems(items.filter((item) => item.id !== id));
  };

  const handleUpdateItem = (id: number, field: keyof Item, value: string | number) => {
    setItems(items.map((item) => {
      if (item.id === id) {
        if (field === 'qty') {
          const newQty = Math.max(1, Number(value));
          return { ...item, qty: newQty };
        }
        return { ...item, [field]: String(value) };
      }
      return item;
    }));
  };

  const handleSubmitClick = () => {
    const validationError = validateForm();
    if (validationError) {
      showError(validationError, 5000);
      return;
    }
    setIsModalOpen(true);
  };

  const handleConfirm = async () => {
    const validationError = validateForm();
    if (validationError) {
      showError(validationError, 5000);
      setIsModalOpen(false);
      return;
    }
    setIsSubmitting(true);
    try {
      const details = view === 'siz' ? sizForm : items.filter(item => item.name && item.name.trim());
      await addRequest({ type: view, user: selectedEmployee, details: details });
      
      success('Заявка успешно отправлена!', 5000);
      resetForm();
      setIsModalOpen(false);
      setView('menu');
    } catch (err: any) {
      console.error('Ошибка отправки:', err);
      const errorMessage = err?.response?.data?.error || err?.message || 'Не удалось отправить заявку.';
      showError(errorMessage, 7000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setItems([{ id: Date.now(), name: '', qty: 1 }]);
    setSelectedEmployee('');
    setSizForm({ clothingSeason: '', shoeSeason: '', height: '', clothingSize: '', shoeSize: '' });
  };

  // --- VIEW: MENU ---
  if (view === 'menu') {
    // 🎨 ЦВЕТА: Используем полупрозрачные фоны (white/5) и яркие акценты для иконок
    const menuItems = [
      { id: 'siz', label: 'СИЗ', icon: HardHat, color: 'bg-blue-500/20 text-blue-200' },
      { id: 'tools', label: 'Инструменты', icon: Wrench, color: 'bg-amber-500/20 text-amber-200' },
      { id: 'equipment', label: 'Оборудование', icon: Truck, color: 'bg-indigo-500/20 text-indigo-200' },
      { id: 'consumables', label: 'Расходники', icon: Package, color: 'bg-emerald-500/20 text-emerald-200' },
    ];

    return (
      // 📏 LAYOUT FIX: max-w-xl везде одинаковый
      <div className="grid grid-cols-2 gap-4 max-w-xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-700">
        {menuItems.map((item) => (
          <motion.button
            key={item.id}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setView(item.id as ViewState)}
            // 🎨 STYLE FIX: Glassmorphism для темной темы (white/5 + border-white/10)
            className="relative overflow-hidden flex flex-col items-center justify-center p-6 h-40 bg-white/5 backdrop-blur-md rounded-3xl border border-white/10 shadow-lg hover:bg-white/10 hover:border-white/20 transition-all group"
          >
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 transition-all duration-500 group-hover:scale-110 ${item.color} shadow-inner`}>
              <item.icon size={28} />
            </div>
            {/* Текст белый, но чуть мягкий */}
            <span className="font-semibold text-white/90 text-base tracking-wide">{item.label}</span>
          </motion.button>
        ))}
      </div>
    );
  }

  // --- VIEW: FORM ---
  return (
    // 📏 LAYOUT FIX: max-w-xl (совпадает с меню)
    <div className="max-w-xl mx-auto pb-10">
      <div className="flex items-center gap-4 mb-6 px-2">
        <button
          onClick={() => {
            // 🛠 UX FIX: Не сбрасываем форму, просто меняем View
            // resetForm(); <--- УДАЛЕНО
            setView('menu');
          }}
          className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/70 hover:bg-white/10 hover:text-white transition-colors backdrop-blur-sm"
        >
          <ChevronLeft size={20} />
        </button>
        <h2 className="text-xl font-bold text-white tracking-wide">
          {{ siz: 'Заявка на СИЗ', tools: 'Инструменты', equipment: 'Оборудование', consumables: 'Расходники' }[view]}
        </h2>
      </div>

      {/* 🎬 ANIMATION FIX: Добавлена анимация появления для формы */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Card className="bg-white/10 backdrop-blur-2xl border border-white/10 shadow-2xl p-6 overflow-visible">
          
          <div className="mb-6">
            <Autocomplete
              label="ФИО Сотрудника"
              value={selectedEmployee}
              onChange={setSelectedEmployee}
              options={employees.map((e: any) => e.fullName)}
              placeholder="Начните вводить ФИО..."
            />
          </div>

          {view === 'siz' ? (
            <div className="space-y-5">
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
              {/* Хедер списка */}
              <div className="flex items-center justify-between mb-2 text-white/50 px-1">
                <h3 className="text-xs font-bold uppercase tracking-widest">Список позиций</h3>
                <div className="text-[10px] font-mono opacity-70">
                  TOTAL: {totalQuantity}
                </div>
              </div>

              <div className="space-y-3">
                <AnimatePresence mode="popLayout">
                  {items.map((item, index) => (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
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
                      
                      {/* Блок количества */}
                      <div className={`flex flex-col gap-2 ${index === 0 ? '' : 'pt-0'}`}>
                        {index === 0 && (
                          <span className="text-xs font-semibold text-white/40 uppercase tracking-wide text-center">Кол-во</span>
                        )}
                        {/* 🛠 UI FIX: Высота степпера h-12 совпадает с Input */}
                        <div className="h-12 flex items-center bg-white/5 border border-white/10 rounded-xl px-1 text-white">
                          <button
                            type="button"
                            onClick={() => handleUpdateItem(item.id, 'qty', item.qty - 1)}
                            className="w-8 h-full flex items-center justify-center hover:bg-white/10 rounded-lg text-white/70 hover:text-white transition-all"
                          >
                            <Minus size={14} />
                          </button>
                          <span className="w-8 text-center font-semibold text-sm">{item.qty}</span>
                          <button
                            type="button"
                            onClick={() => handleUpdateItem(item.id, 'qty', item.qty + 1)}
                            className="w-8 h-full flex items-center justify-center hover:bg-white/10 rounded-lg text-white/70 hover:text-white transition-all"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      </div>

                      {/* Кнопка удаления */}
                      <div className={index === 0 ? 'pb-2' : ''}> 
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(item.id)}
                          disabled={items.length <= 1}
                          className={`h-8 w-8 flex items-center justify-center rounded-lg transition-colors ${
                            items.length > 1 
                              ? 'text-white/40 hover:text-red-400 hover:bg-white/5' 
                              : 'text-transparent cursor-default'
                          }`}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              <button
                type="button"
                onClick={handleAddItem}
                className="w-full py-3 border border-dashed border-white/20 rounded-xl text-white/50 hover:border-indigo-500/50 hover:text-indigo-200 hover:bg-indigo-500/10 transition-all flex items-center justify-center gap-2 text-sm font-medium"
              >
                <Plus size={16} /> Добавить позицию
              </button>
            </div>
          )}

          <div className="pt-6 mt-6 border-t border-white/10">
            <Button 
              className="w-full h-12 text-base font-medium bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-500/20 transition-all" 
              onClick={handleSubmitClick}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="animate-spin" size={18} />
                  Отправка...
                </span>
              ) : (
                'Отправить заявку'
              )}
            </Button>
          </div>
        </Card>
      </motion.div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => !isSubmitting && setIsModalOpen(false)}
        onConfirm={handleConfirm}
        title="Подтверждение отправки"
        description={`Заявка будет оформлена на сотрудника: ${selectedEmployee}`}
        confirmText="Отправить"
        cancelText="Отмена"
        isLoading={isSubmitting}
        variant="default"
      />
    </div>
  );
};