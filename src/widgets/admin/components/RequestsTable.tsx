import { useState } from 'react';
import { RequestEntry } from '@/entities/request/model/store';
import { Eye, Trash2, CheckCircle, Clock, Ban, Filter, ArrowUpDown } from 'lucide-react';
import { formatDate } from '@/shared/lib/dateFormatter';

interface RequestsTableProps {
  requests: RequestEntry[];
  onView: (id: string) => void;
  onDelete?: (id: string) => void;
  onUpdateStatus?: (id: string, status: RequestEntry['status']) => void;
}

type SortField = 'date' | 'user' | 'type' | 'status';
type SortOrder = 'asc' | 'desc';

export const RequestsTable = ({ requests, onView, onDelete, onUpdateStatus }: RequestsTableProps) => {
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');

  const typeMap: Record<string, { label: string; color: string }> = {
    siz: { label: 'СИЗ', color: 'bg-blue-500/10 text-blue-300 border-blue-500/20' },
    tools: { label: 'Инструменты', color: 'bg-amber-500/10 text-amber-300 border-amber-500/20' },
    equipment: { label: 'Оборудование', color: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20' },
    consumables: { label: 'Расходники', color: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20' },
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  // Фильтрация и сортировка
  const processedRequests = requests
    .filter(req => {
      if (filterStatus !== 'all' && req.status !== filterStatus) return false;
      if (filterType !== 'all' && req.type !== filterType) return false;
      return true;
    })
    .sort((a, b) => {
      let comparison = 0;
      
      switch (sortField) {
        case 'date':
          const dateA = new Date(a.createdAt || a.date).getTime();
          const dateB = new Date(b.createdAt || b.date).getTime();
          comparison = dateB - dateA;
          break;
        case 'user':
          comparison = a.user.localeCompare(b.user, 'ru');
          break;
        case 'type':
          comparison = a.type.localeCompare(b.type);
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  const SortButton = ({ field, label }: { field: SortField; label: string }) => (
    <button
      onClick={() => handleSort(field)}
      className="flex items-center gap-1 hover:text-white transition-colors group"
    >
      {label}
      <ArrowUpDown 
        size={12} 
        className={`transition-all ${
          sortField === field 
            ? 'text-red-400 opacity-100' 
            : 'opacity-0 group-hover:opacity-50'
        }`}
      />
    </button>
  );

  return (
    <div className="flex flex-col h-full">
      {/* Фильтры */}
      <div className="p-4 border-b border-white/5 bg-white/5 flex flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-white/40" />
          <span className="text-xs text-white/60 font-bold uppercase">Фильтры:</span>
        </div>
        
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-1.5 text-xs bg-white/5 border border-white/10 rounded-lg text-white/80 focus:outline-none focus:ring-1 focus:ring-red-500/50"
        >
          <option value="all">Все статусы</option>
          <option value="Новая">Новые</option>
          <option value="В работе">В работе</option>
          <option value="Завершена">Завершенные</option>
        </select>

        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-3 py-1.5 text-xs bg-white/5 border border-white/10 rounded-lg text-white/80 focus:outline-none focus:ring-1 focus:ring-red-500/50"
        >
          <option value="all">Все типы</option>
          <option value="siz">СИЗ</option>
          <option value="tools">Инструменты</option>
          <option value="equipment">Оборудование</option>
          <option value="consumables">Расходники</option>
        </select>

        <div className="ml-auto text-xs text-white/40">
          Показано: <span className="text-white/80 font-bold">{processedRequests.length}</span> из {requests.length}
        </div>
      </div>

      {/* Таблица */}
      <div className="flex-1 overflow-auto custom-scrollbar">
        <table className="w-full text-left border-collapse">
          <thead className="bg-[#1a1f2e] sticky top-0 z-10 shadow-lg shadow-black/20">
            <tr className="text-[10px] uppercase tracking-widest text-white/40 font-black">
              <th className="p-4 pl-6">
                <SortButton field="user" label="ФИО Сотрудника" />
              </th>
              <th className="p-4">
                <SortButton field="type" label="Тип запроса" />
              </th>
              <th className="p-4">
                <SortButton field="date" label="Дата создания" />
              </th>
              <th className="p-4">
                <SortButton field="status" label="Статус" />
              </th>
              <th className="p-4 text-right pr-6">Действия</th>
            </tr>
          </thead>
          <tbody className="text-sm text-white/90 divide-y divide-white/5">
            {processedRequests.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-12 text-center text-white/30">
                  <Filter size={32} className="opacity-20 mx-auto mb-2" />
                  <span>Нет заявок по выбранным фильтрам</span>
                </td>
              </tr>
            ) : (
              processedRequests.map((req: RequestEntry) => (
                <tr key={req.id} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="p-4 pl-6 font-bold text-white group-hover:text-red-400 transition-colors">
                    {req.user}
                  </td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase border ${typeMap[req.type]?.color || 'bg-white/10 text-white'}`}>
                      {typeMap[req.type]?.label || req.type}
                    </span>
                  </td>
                  <td className="p-4 text-white/60 text-xs font-mono">
                    {formatDate(req.createdAt || req.date)}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase ${
                        req.status === 'Новая' ? 'bg-red-500/20 text-red-300 border border-red-500/30' :
                        req.status === 'В работе' ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30' :
                        'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      }`}>
                        {req.status}
                      </span>
                      
                      {/* Быстрая смена статуса */}
                      {onUpdateStatus && (
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                          {req.status !== 'В работе' && (
                            <button
                              onClick={() => onUpdateStatus(req.id, 'В работе')}
                              className="p-1 hover:bg-yellow-500/10 rounded text-yellow-400 transition-colors"
                              title="В работу"
                            >
                              <Clock size={14} />
                            </button>
                          )}
                          {req.status !== 'Завершена' && (
                            <button
                              onClick={() => onUpdateStatus(req.id, 'Завершена')}
                              className="p-1 hover:bg-emerald-500/10 rounded text-emerald-400 transition-colors"
                              title="Завершить"
                            >
                              <CheckCircle size={14} />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="p-4 text-right pr-6">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => onView(req.id)} 
                        className="text-white/30 hover:text-blue-400 transition-colors p-1.5 hover:bg-blue-500/10 rounded"
                        title="Просмотр"
                      >
                        <Eye size={18} />
                      </button>
                      {onDelete && (
                        <button
                          onClick={() => {
                            if (confirm(`Удалить заявку от ${req.user}?`)) {
                              onDelete(req.id);
                            }
                          }}
                          className="text-white/30 hover:text-red-400 transition-colors p-1.5 hover:bg-red-500/10 rounded opacity-0 group-hover:opacity-100"
                          title="Удалить"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
