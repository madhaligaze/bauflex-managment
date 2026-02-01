import { useState } from 'react';
import { X, Edit2, Package } from 'lucide-react';
import { Drawer } from '@/shared/ui/Drawer';
import { Button } from '@/shared/ui/Button';
import { RequestEntry } from '@/entities/request/model/store';
import { formatDate } from '@/shared/lib/dateFormatter';
import { EditRequestModal } from './EditRequestModal';

interface RequestDetailsProps {
  request: RequestEntry;
  onClose: () => void;
  onUpdateStatus: (status: RequestEntry['status']) => void;
  onUpdate?: (data: Partial<RequestEntry>) => void;
}

export const RequestDetails = ({ 
  request, 
  onClose, 
  onUpdateStatus,
  onUpdate 
}: RequestDetailsProps) => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const getStatusColor = (status: string) => {
    if (status === 'Новая') return 'bg-red-500/20 text-red-400 border-red-500/30';
    if (status === 'В работе') return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    return 'bg-green-500/20 text-green-400 border-green-500/30';
  };

  const renderDetails = () => {
    // ✅ СИЗ - отображаем все размеры
    if (request.type === 'siz' && request.details) {
      const d = request.details as any;
      return (
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <Package size={20} className="text-red-500" />
            <h3 className="text-lg font-bold text-white uppercase">Детали СИЗ</h3>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/5 rounded-lg p-4">
              <p className="text-white/50 text-xs mb-1">РОСТ</p>
              <p className="text-white font-semibold">
                {d.height || '—'} см
              </p>
            </div>
            
            <div className="bg-white/5 rounded-lg p-4">
              <p className="text-white/50 text-xs mb-1">РАЗМЕР ОДЕЖДЫ</p>
              <p className="text-white font-semibold">
                {d.clothingSize || '—'}
              </p>
            </div>
            
            <div className="bg-white/5 rounded-lg p-4">
              <p className="text-white/50 text-xs mb-1">СЕЗОН ОДЕЖДЫ</p>
              <p className="text-white font-semibold">
                {d.clothingSeason || '—'}
              </p>
            </div>
            
            <div className="bg-white/5 rounded-lg p-4">
              <p className="text-white/50 text-xs mb-1">РАЗМЕР ОБУВИ</p>
              <p className="text-white font-semibold">
                {d.shoeSize || '—'}
              </p>
            </div>
            
            <div className="bg-white/5 rounded-lg p-4 col-span-2">
              <p className="text-white/50 text-xs mb-1">СЕЗОН ОБУВИ</p>
              <p className="text-white font-semibold">
                {d.shoeSeason || '—'}
              </p>
            </div>
          </div>
        </div>
      );
    }

    // ✅ ИНСТРУМЕНТЫ/ОБОРУДОВАНИЕ/РАСХОДНИКИ - список позиций
    if (Array.isArray(request.details)) {
      return (
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <Package size={20} className="text-red-500" />
            <h3 className="text-lg font-bold text-white uppercase">Список позиций</h3>
          </div>
          
          <div className="space-y-2">
            {request.details.map((item: any, idx: number) => (
              <div 
                key={idx} 
                className="bg-white/5 rounded-lg p-4 flex items-center justify-between"
              >
                <div>
                  <p className="text-white font-semibold">{item.name}</p>
                  <p className="text-white/50 text-sm">Позиция #{idx + 1}</p>
                </div>
                <div className="text-right">
                  <p className="text-white font-bold text-xl">{item.qty}</p>
                  <p className="text-white/50 text-xs">штук</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    // ✅ ОБЪЕКТ С ДЕТАЛЯМИ
    if (typeof request.details === 'object' && request.details !== null) {
      const d = request.details as any;
      return (
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <Package size={20} className="text-red-500" />
            <h3 className="text-lg font-bold text-white uppercase">Подробности</h3>
          </div>
          
          <div className="space-y-3">
            {d.itemName && (
              <div className="bg-white/5 rounded-lg p-4">
                <p className="text-white/50 text-xs mb-1">НАИМЕНОВАНИЕ</p>
                <p className="text-white font-semibold">{d.itemName}</p>
              </div>
            )}
            
            {d.quantity && (
              <div className="bg-white/5 rounded-lg p-4">
                <p className="text-white/50 text-xs mb-1">КОЛИЧЕСТВО</p>
                <p className="text-white font-semibold">
                  {d.quantity} {d.unit || 'шт.'}
                </p>
              </div>
            )}
            
            {d.purpose && (
              <div className="bg-white/5 rounded-lg p-4">
                <p className="text-white/50 text-xs mb-1">НАЗНАЧЕНИЕ</p>
                <p className="text-white font-semibold">{d.purpose}</p>
              </div>
            )}
            
            {d.notes && (
              <div className="bg-white/5 rounded-lg p-4">
                <p className="text-white/50 text-xs mb-1">ПРИМЕЧАНИЕ</p>
                <p className="text-white font-semibold">{d.notes}</p>
              </div>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="text-white/50 text-center py-8">
        Нет подробной информации
      </div>
    );
  };

  return (
    <>
      {/* FIXED: Using Drawer without custom close button - Drawer has its own */}
      <Drawer isOpen={true} onClose={onClose} title={`Заявка #${request.id}`}>
        <div className="space-y-6 p-6">
          {/* Заголовок - removed duplicate X button */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-black text-white">
                {request.user}
              </h2>
              <p className="text-white/50 text-sm mt-1">
                {formatDate(request.createdAt || request.date)}
              </p>
            </div>
          </div>

          {/* Статус */}
          <div className="flex items-center gap-4">
            <span 
              className={`px-4 py-2 rounded-lg border font-bold text-sm ${getStatusColor(request.status)}`}
            >
              {request.status}
            </span>
            
            <span className="px-4 py-2 bg-white/5 rounded-lg text-white/70 text-sm font-semibold">
              {request.type === 'siz' ? 'СИЗ' : 
               request.type === 'tools' ? 'Инструменты' :
               request.type === 'equipment' ? 'Оборудование' : 'Расходники'}
            </span>
          </div>

          {/* Детали */}
          {renderDetails()}

          {/* Кнопки действий */}
          <div className="flex gap-3 pt-4 border-t border-white/10">
            <Button
              onClick={() => setIsEditModalOpen(true)}
              variant="secondary"
              className="flex-1 bg-white/5 hover:bg-white/10"
            >
              <Edit2 size={16} className="mr-2" />
              Редактировать
            </Button>
            
            {request.status === 'Новая' && (
              <Button
                onClick={() => onUpdateStatus('В работе')}
                className="flex-1 bg-yellow-600 hover:bg-yellow-500"
              >
                В работу
              </Button>
            )}
            
            {request.status === 'В работе' && (
              <Button
                onClick={() => onUpdateStatus('Завершена')}
                className="flex-1 bg-green-600 hover:bg-green-500"
              >
                Завершить
              </Button>
            )}
          </div>
        </div>
      </Drawer>

      {/* Модалка редактирования */}
      {isEditModalOpen && onUpdate && (
        <EditRequestModal
          request={request}
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSave={async (data) => {
            await onUpdate(data);
            setIsEditModalOpen(false);
            onClose();
          }}
        />
      )}
    </>
  );
};
