import { useState } from 'react';
import { Edit2, Package, Clock, CheckCircle, Trash2, Calendar, User } from 'lucide-react';
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

  // Helper for Status UI
  const getStatusBadge = (status: string) => {
    const styles = status === 'Новая' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                   status === 'В работе' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                   'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    return (
      <span className={`px-3 py-1 rounded-lg border text-xs font-bold uppercase tracking-wider ${styles}`}>
        {status}
      </span>
    );
  };

  const DetailRow = ({ label, value }: { label: string, value: string | number }) => (
    <div className="bg-white/[0.03] rounded-xl p-4 border border-white/5">
      <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest mb-1.5">{label}</p>
      <p className="text-white font-semibold text-sm">{value || '—'}</p>
    </div>
  );

  const renderContent = () => {
    // 1. СИЗ
    if (request.type === 'siz' && request.details) {
      const d = request.details as any;
      return (
        <div className="space-y-4 animate-in fade-in zoom-in-95 duration-300">
          <div className="flex items-center gap-2 mb-2 opacity-80">
            <Package size={18} className="text-red-500" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Параметры СИЗ</h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <DetailRow label="Рост" value={`${d.height || 0} см`} />
            <DetailRow label="Размер одежды" value={d.clothingSize} />
            <DetailRow label="Сезон одежды" value={d.clothingSeason} />
            <DetailRow label="Размер обуви" value={d.shoeSize} />
            <div className="col-span-2">
              <DetailRow label="Сезон обуви" value={d.shoeSeason} />
            </div>
          </div>
        </div>
      );
    }

    // 2. Списки (Инструменты и т.д.)
    if (Array.isArray(request.details)) {
      return (
        <div className="space-y-3 animate-in fade-in zoom-in-95 duration-300">
          <div className="flex items-center gap-2 mb-2 opacity-80">
             <Package size={18} className="text-red-500" />
             <h3 className="text-sm font-bold text-white uppercase tracking-wider">Позиции</h3>
          </div>
          {request.details.map((item: any, idx: number) => (
            <div key={idx} className="bg-white/[0.03] border border-white/5 rounded-xl p-4 flex justify-between items-center">
              <div>
                <p className="text-white font-bold">{item.name}</p>
                <p className="text-white/40 text-xs mt-1">Позиция #{idx + 1}</p>
              </div>
              <div className="text-right bg-white/5 px-3 py-1 rounded-lg">
                <span className="text-white font-bold text-lg">{item.qty}</span>
                <span className="text-white/40 text-xs ml-1">шт.</span>
              </div>
            </div>
          ))}
        </div>
      );
    }

    // 3. Общие детали
    if (typeof request.details === 'object' && request.details !== null) {
      const d = request.details as any;
      return (
        <div className="space-y-3 animate-in fade-in zoom-in-95 duration-300">
          <div className="flex items-center gap-2 mb-2 opacity-80">
             <Package size={18} className="text-red-500" />
             <h3 className="text-sm font-bold text-white uppercase tracking-wider">Информация</h3>
          </div>
          {d.itemName && <DetailRow label="Наименование" value={d.itemName} />}
          <div className="grid grid-cols-2 gap-3">
             {d.quantity && <DetailRow label="Количество" value={`${d.quantity} ${d.unit || ''}`} />}
             {d.purpose && <DetailRow label="Назначение" value={d.purpose} />}
          </div>
          {d.notes && <DetailRow label="Примечание" value={d.notes} />}
        </div>
      );
    }

    return <div className="p-6 text-center text-white/30 italic">Нет деталей</div>;
  };

  return (
    <>
      <Drawer isOpen={true} onClose={onClose} title={`Заявка #${request.id.slice(0, 8)}`}>
        <div className="flex flex-col h-full">
          <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
            
            {/* Header Info */}
            <div className="space-y-6">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-black text-white leading-tight">{request.user}</h2>
                  <div className="flex items-center gap-2 mt-2 text-white/50 text-sm">
                    <Calendar size={14} />
                    <span className="font-mono">{formatDate(request.createdAt || request.date)}</span>
                  </div>
                </div>
                {getStatusBadge(request.status)}
              </div>

              <div className="bg-white/5 rounded-xl p-1 inline-flex">
                 <span className="px-3 py-1.5 text-xs font-bold uppercase text-white/80">
                   Тип запроса:
                 </span>
                 <span className="px-3 py-1.5 text-xs font-bold uppercase text-white bg-white/10 rounded-lg ml-1">
                   {request.type === 'siz' ? 'СИЗ' : 
                    request.type === 'tools' ? 'Инструменты' :
                    request.type === 'equipment' ? 'Оборудование' : 'Расходники'}
                 </span>
              </div>
            </div>

            <div className="h-px bg-white/10 w-full" />

            {/* Dynamic Content */}
            {renderContent()}
            
          </div>

          {/* Footer Actions */}
          <div className="p-6 border-t border-white/10 bg-[#0f1219] mt-auto space-y-3">
            <div className="flex gap-3">
              <Button
                onClick={() => setIsEditModalOpen(true)}
                variant="secondary"
                className="flex-1 bg-white/5 hover:bg-white/10 border-white/10 h-12"
              >
                <Edit2 size={16} className="mr-2" />
                Редактировать
              </Button>
              
              {request.status === 'Новая' && (
                <Button
                  onClick={() => onUpdateStatus('В работе')}
                  className="flex-1 bg-amber-600 hover:bg-amber-500 text-white border-0 h-12 font-bold"
                >
                  <Clock size={16} className="mr-2" />
                  В работу
                </Button>
              )}
              
              {request.status === 'В работе' && (
                <Button
                  onClick={() => onUpdateStatus('Завершена')}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white border-0 h-12 font-bold"
                >
                  <CheckCircle size={16} className="mr-2" />
                  Завершить
                </Button>
              )}
            </div>
          </div>
        </div>
      </Drawer>

      {isEditModalOpen && onUpdate && (
        <EditRequestModal
          request={request}
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSave={async (data) => {
            await onUpdate(data);
            setIsEditModalOpen(false);
            onClose(); // Закрываем и основную, или оставляем открытой для просмотра обновлений? 
            // Обычно лучше оставить RequestDetails открытым, чтобы увидеть изменения:
            // onClose(); 
          }}
        />
      )}
    </>
  );
};