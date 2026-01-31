import { RequestEntry } from '@/entities/request/model/store';
import { X, Calendar, User, Package, ClipboardList, Clock, CheckCircle, Pencil } from 'lucide-react';
import { formatDate } from '@/shared/lib/dateFormatter';
import { Button } from '@/shared/ui/Button';

interface RequestDetailsProps {
  request: RequestEntry | null;
  onClose: () => void;
  onUpdateStatus?: (status: RequestEntry['status']) => void;
  onEdit?: () => void;
}

export const RequestDetails = ({ request, onClose, onUpdateStatus, onEdit }: RequestDetailsProps) => {
  if (!request) return null;

  const typeLabels: Record<string, string> = {
    siz: 'СИЗ',
    tools: 'Инструменты',
    equipment: 'Оборудование',
    consumables: 'Расходники'
  };

  const renderDetails = () => {
    if (request.type === 'siz') {
      const d = request.details;
      return (
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="text-xs text-white/40 uppercase tracking-wide">Сезон одежды</div>
            <div className="text-white font-semibold">{d.clothingSeason || '—'}</div>
          </div>
          <div className="space-y-1">
            <div className="text-xs text-white/40 uppercase tracking-wide">Сезон обуви</div>
            <div className="text-white font-semibold">{d.shoeSeason || '—'}</div>
          </div>
          <div className="space-y-1">
            <div className="text-xs text-white/40 uppercase tracking-wide">Рост</div>
            <div className="text-white font-semibold">{d.height || '—'} см</div>
          </div>
          <div className="space-y-1">
            <div className="text-xs text-white/40 uppercase tracking-wide">Размер одежды</div>
            <div className="text-white font-semibold">{d.clothingSize || '—'}</div>
          </div>
          <div className="space-y-1">
            <div className="text-xs text-white/40 uppercase tracking-wide">Размер обуви</div>
            <div className="text-white font-semibold">{d.shoeSize || '—'}</div>
          </div>
        </div>
      );
    }

    if (Array.isArray(request.details)) {
      return (
        <div className="space-y-2">
          <div className="text-xs text-white/40 uppercase tracking-wide mb-3">Позиции заказа</div>
          {request.details.map((item: any, idx: number) => (
            <div 
              key={idx}
              className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-300 font-bold text-sm">
                  {idx + 1}
                </div>
                <span className="text-white font-medium">{item.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-white/40 text-xs">Количество:</span>
                <span className="px-3 py-1 bg-white/10 rounded-md text-white font-bold text-sm">
                  {item.qty} шт.
                </span>
              </div>
            </div>
          ))}
          <div className="mt-4 p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-indigo-300 font-bold text-sm uppercase tracking-wide">Всего позиций:</span>
              <span className="text-indigo-300 font-bold text-lg">{request.details.length}</span>
            </div>
            <div className="flex items-center justify-between mt-1">
              <span className="text-indigo-300 font-bold text-sm uppercase tracking-wide">Всего единиц:</span>
              <span className="text-indigo-300 font-bold text-lg">
                {request.details.reduce((sum: number, item: any) => sum + (item.qty || 0), 0)}
              </span>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="text-white/60 italic">Детали отсутствуют</div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-white/10 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl animate-in slide-in-from-bottom-8 duration-300">
        {/* Шапка */}
        <div className="p-6 border-b border-white/10 bg-gradient-to-r from-red-600 to-red-800">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                  <ClipboardList size={20} className="text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white uppercase tracking-wide">
                    Заявка #{request.id.slice(0, 8)}
                  </h3>
                  <div className="text-white/60 text-sm font-medium">
                    {typeLabels[request.type] || request.type}
                  </div>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white/60 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Контент */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)] custom-scrollbar">
          {/* Основная информация */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="flex items-center gap-3 p-4 bg-white/5 rounded-lg border border-white/10">
              <User size={20} className="text-blue-400" />
              <div>
                <div className="text-xs text-white/40 uppercase tracking-wide">Сотрудник</div>
                <div className="text-white font-bold text-lg">{request.user}</div>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-4 bg-white/5 rounded-lg border border-white/10">
              <Calendar size={20} className="text-green-400" />
              <div>
                <div className="text-xs text-white/40 uppercase tracking-wide">Дата создания</div>
                <div className="text-white font-bold">{formatDate(request.createdAt || request.date)}</div>
              </div>
            </div>
          </div>

          {/* Статус */}
          <div className="mb-6 p-4 bg-white/5 rounded-lg border border-white/10">
            <div className="text-xs text-white/40 uppercase tracking-wide mb-2">Текущий статус</div>
            <div className="flex items-center justify-between">
              <span className={`px-4 py-2 rounded-lg text-sm font-bold uppercase ${
                request.status === 'Новая' ? 'bg-red-500/20 text-red-300 border border-red-500/30' :
                request.status === 'В работе' ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30' :
                'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              }`}>
                {request.status}
              </span>

              {onUpdateStatus && request.status !== 'Завершена' && (
                <div className="flex gap-2">
                  {request.status !== 'В работе' && (
                    <Button
                      onClick={() => onUpdateStatus('В работе')}
                      size="sm"
                      className="bg-yellow-600 hover:bg-yellow-500"
                    >
                      <Clock size={16} className="mr-1" />
                      В работу
                    </Button>
                  )}
                  <Button
                    onClick={() => onUpdateStatus('Завершена')}
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-500"
                  >
                    <CheckCircle size={16} className="mr-1" />
                    Завершить
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Детали заявки */}
          <div className="p-4 bg-white/5 rounded-lg border border-white/10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Package size={20} className="text-indigo-400" />
                <h4 className="text-white font-bold uppercase tracking-wide">Детали заявки</h4>
              </div>
              {onEdit && (
                <button
                  onClick={onEdit}
                  className="text-white/40 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
                  title="Редактировать"
                >
                  <Pencil size={16} />
                </button>
              )}
            </div>
            {renderDetails()}
          </div>
        </div>

        {/* Футер */}
        <div className="p-4 border-t border-white/10 bg-white/5 flex justify-end gap-3">
          <Button onClick={onClose} variant="secondary">
            Закрыть
          </Button>
        </div>
      </div>
    </div>
  );
};
