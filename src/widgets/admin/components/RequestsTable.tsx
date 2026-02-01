import { useState } from 'react';
import { RequestEntry } from '@/entities/request/model/store';
import { Eye, Trash2, CheckCircle, Clock, Filter, ArrowUpDown } from 'lucide-react';
import { formatDate } from '@/shared/lib/dateFormatter';
import { motion } from 'framer-motion';

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
    siz: { label: 'СИЗ', color: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
    tools: { label: 'Инструменты', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
    equipment: { label: 'Оборудование', color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' },
    consumables: { label: 'Расходники', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

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
      className="flex items-center gap-2 hover:text-white transition-colors group w-full text-left"
    >
      <span>{label}</span>
      <ArrowUpDown 
        size={14} 
        className={`transition-all ${
          sortField === field 
            ? 'text-red-400 opacity-100' 
            : 'opacity-0 group-hover:opacity-30'
        }`}
      />
    </button>
  );

  return (
    <div className="flex flex-col h-full rounded-2xl overflow-hidden border border-white/10 bg-white/[0.02]">
      {/* Фильтры */}
      <div className="p-4 border-b border-white/10 bg-slate-900/50 backdrop-blur-xl flex flex-wrap gap-3 items-center z-20 relative">
        <div className="flex items-center gap-2 mr-2">
          <div className="w-1 h-5 bg-red-600 rounded-full shadow-[0_0_10px_rgba(220,38,38,0.5)]" />
          <Filter size={16} className="text-red-400" />
          <span className="text-xs text-white/80 font-bold uppercase tracking-wider">Фильтры</span>
        </div>
        
        {/* FIXED: Increased height to h-10 and adjusted padding to prevent text cut-off */}
        <div className="relative">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="h-10 pl-3 pr-8 text-xs bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-red-500/50 hover:bg-white/10 transition-colors cursor-pointer appearance-none min-w-[120px]"
          >
            <option value="all" className="bg-slate-900">Все статусы</option>
            <option value="Новая" className="bg-slate-900">Новые</option>
            <option value="В работе" className="bg-slate-900">В работе</option>
            <option value="Завершена" className="bg-slate-900">Завершенные</option>
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-white/40">
            <ArrowUpDown size={12} />
          </div>
        </div>

        <div className="relative">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="h-10 pl-3 pr-8 text-xs bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-red-500/50 hover:bg-white/10 transition-colors cursor-pointer appearance-none min-w-[120px]"
          >
            <option value="all" className="bg-slate-900">Все типы</option>
            <option value="siz" className="bg-slate-900">СИЗ</option>
            <option value="tools" className="bg-slate-900">Инструменты</option>
            <option value="equipment" className="bg-slate-900">Оборудование</option>
            <option value="consumables" className="bg-slate-900">Расходники</option>
          </select>
           <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-white/40">
            <ArrowUpDown size={12} />
          </div>
        </div>

        <div className="ml-auto text-xs flex items-center gap-2">
          <span className="text-white/40">Всего:</span>
          <span className="text-white font-mono font-bold bg-white/5 px-2 py-0.5 rounded">
            {processedRequests.length}
          </span>
        </div>
      </div>

      {/* Таблица */}
      <div className="flex-1 overflow-auto custom-scrollbar relative">
        <table className="w-full text-left border-collapse table-fixed">
          <thead className="bg-[#131722] sticky top-0 z-10 shadow-lg shadow-black/20">
            <tr className="text-[10px] uppercase tracking-widest text-white/40 font-black h-12">
              <th className="px-6 py-3 w-[30%] align-middle border-b border-white/5">
                <SortButton field="user" label="ФИО Сотрудника" />
              </th>
              <th className="px-4 py-3 w-[15%] align-middle border-b border-white/5">
                <SortButton field="type" label="Тип" />
              </th>
              <th className="px-4 py-3 w-[20%] align-middle border-b border-white/5">
                <SortButton field="date" label="Дата" />
              </th>
              <th className="px-4 py-3 w-[20%] align-middle border-b border-white/5">
                <SortButton field="status" label="Статус" />
              </th>
              <th className="px-6 py-3 w-[15%] text-right align-middle border-b border-white/5">
                Действия
              </th>
            </tr>
          </thead>
          <tbody className="text-sm text-white/90">
            {processedRequests.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-12 text-center align-middle">
                  <div className="flex flex-col items-center gap-3 opacity-40">
                    <Filter size={40} className="opacity-30" />
                    <span className="text-white/60 text-sm">Список пуст</span>
                  </div>
                </td>
              </tr>
            ) : (
              processedRequests.map((req: RequestEntry, index: number) => (
                <motion.tr 
                  key={req.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.02 }}
                  className="group border-b border-white/5 hover:bg-white/[0.04] transition-colors relative"
                >
                  {/* ФИО */}
                  <td className="px-6 py-4 align-middle relative">
                    <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="font-bold text-white group-hover:text-red-100 transition-colors truncate pr-4" title={req.user}>
                      {req.user}
                    </div>
                  </td>
                  
                  {/* Тип */}
                  <td className="px-4 py-4 align-middle">
                    <span className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase border ${typeMap[req.type]?.color || 'bg-white/10 text-white border-white/20'} whitespace-nowrap`}>
                      {typeMap[req.type]?.label || req.type}
                    </span>
                  </td>
                  
                  {/* Дата */}
                  <td className="px-4 py-4 align-middle text-white/60 text-xs font-mono tabular-nums">
                    {formatDate(req.createdAt || req.date)}
                  </td>
                  
                  {/* Статус */}
                  <td className="px-4 py-4 align-middle">
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] font-bold uppercase border whitespace-nowrap ${
                        req.status === 'Новая' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                        req.status === 'В работе' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                        'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                           req.status === 'Новая' ? 'bg-red-500 animate-pulse' :
                           req.status === 'В работе' ? 'bg-amber-500' : 'bg-emerald-500'
                        }`} />
                        {req.status}
                      </span>
                      
                      {/* Быстрые действия */}
                      {onUpdateStatus && (
                        <div className="flex opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-2 group-hover:translate-x-0 duration-200">
                          {req.status !== 'В работе' && req.status !== 'Завершена' && (
                            <button
                              onClick={() => onUpdateStatus(req.id, 'В работе')}
                              className="p-1 text-amber-400 hover:bg-amber-500/20 rounded ml-1"
                              title="В работу"
                            >
                              <Clock size={14} />
                            </button>
                          )}
                          {req.status !== 'Завершена' && (
                            <button
                              onClick={() => onUpdateStatus(req.id, 'Завершена')}
                              className="p-1 text-emerald-400 hover:bg-emerald-500/20 rounded ml-1"
                              title="Завершить"
                            >
                              <CheckCircle size={14} />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </td>
                  
                  {/* Действия */}
                  <td className="px-6 py-4 align-middle text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button 
                        onClick={() => onView(req.id)} 
                        className="p-2 text-white/40 hover:text-blue-400 hover:bg-blue-500/10 rounded transition-colors"
                        title="Подробнее"
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
                          className="p-2 text-white/40 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors opacity-0 group-hover:opacity-100"
                          title="Удалить"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>
                  </td>
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};