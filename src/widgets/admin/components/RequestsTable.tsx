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
      className="flex items-center gap-1.5 hover:text-white transition-colors group"
    >
      {label}
      <ArrowUpDown 
        size={13} 
        className={`transition-all ${
          sortField === field 
            ? 'text-red-400 opacity-100 scale-110' 
            : 'opacity-0 group-hover:opacity-50'
        }`}
      />
    </button>
  );

  return (
    <div className="flex flex-col h-full rounded-2xl overflow-hidden border border-white/10 bg-white/[0.02]">
      {/* Enhanced Filters Panel */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-4 border-b border-white/10 bg-gradient-to-r from-white/[0.03] to-white/[0.01] backdrop-blur-xl"
      >
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex items-center gap-2">
            <div className="w-1 h-5 bg-gradient-to-b from-red-500 to-red-600 rounded-full" />
            <Filter size={16} className="text-red-400" />
            <span className="text-xs text-white/80 font-bold uppercase tracking-wider">Фильтры</span>
          </div>
          
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 text-xs bg-white/5 border border-white/10 rounded-xl text-white/90 focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500/50 transition-all hover:bg-white/10 backdrop-blur-xl cursor-pointer"
          >
            <option value="all" className="bg-slate-900">Все статусы</option>
            <option value="Новая" className="bg-slate-900">Новые</option>
            <option value="В работе" className="bg-slate-900">В работе</option>
            <option value="Завершена" className="bg-slate-900">Завершенные</option>
          </select>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2 text-xs bg-white/5 border border-white/10 rounded-xl text-white/90 focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500/50 transition-all hover:bg-white/10 backdrop-blur-xl cursor-pointer"
          >
            <option value="all" className="bg-slate-900">Все типы</option>
            <option value="siz" className="bg-slate-900">СИЗ</option>
            <option value="tools" className="bg-slate-900">Инструменты</option>
            <option value="equipment" className="bg-slate-900">Оборудование</option>
            <option value="consumables" className="bg-slate-900">Расходники</option>
          </select>

          <div className="ml-auto text-xs">
            <span className="text-white/50">Показано:</span>
            <span className="text-white font-bold ml-1.5 px-2 py-1 bg-red-500/10 border border-red-500/20 rounded-lg">
              {processedRequests.length}
            </span>
            <span className="text-white/50 ml-1">из {requests.length}</span>
          </div>
        </div>
      </motion.div>

      {/* Enhanced Table - FIXED alignment */}
      <div className="flex-1 overflow-auto custom-scrollbar">
        <table className="w-full text-left">
          <thead className="bg-gradient-to-r from-slate-900/90 to-slate-950/90 sticky top-0 z-10 backdrop-blur-xl border-b border-white/10">
            <tr className="text-[10px] uppercase tracking-widest text-white/50 font-black">
              <th className="p-4 pl-6 font-black">
                <SortButton field="user" label="ФИО Сотрудника" />
              </th>
              <th className="p-4 font-black">
                <SortButton field="type" label="Тип запроса" />
              </th>
              <th className="p-4 font-black">
                <SortButton field="date" label="Дата создания" />
              </th>
              <th className="p-4 font-black">
                <SortButton field="status" label="Статус" />
              </th>
              <th className="p-4 text-right pr-6 font-black">Действия</th>
            </tr>
          </thead>
          <tbody className="text-sm text-white/90">
            {processedRequests.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-12 text-center">
                  <div className="flex flex-col items-center gap-3 opacity-40">
                    <Filter size={40} className="opacity-30" />
                    <span className="text-white/60 text-sm">Нет заявок по выбранным фильтрам</span>
                  </div>
                </td>
              </tr>
            ) : (
              processedRequests.map((req: RequestEntry, index: number) => (
                <motion.tr 
                  key={req.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="border-b border-white/5 hover:bg-white/[0.03] transition-all duration-200 group relative"
                >
                  {/* Hover accent line - NOT a td element */}
                  <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gradient-to-b from-red-500/0 via-red-500/50 to-red-500/0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                  
                  {/* FIXED: ФИО cell - proper alignment */}
                  <td className="p-4 pl-6">
                    <div className="font-bold text-white group-hover:text-red-400 transition-colors">
                      {req.user}
                    </div>
                  </td>
                  
                  <td className="p-4">
                    <span className={`px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase border ${typeMap[req.type]?.color || 'bg-white/10 text-white border-white/20'} inline-flex items-center gap-1.5`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                      {typeMap[req.type]?.label || req.type}
                    </span>
                  </td>
                  
                  <td className="p-4 text-white/60 text-xs font-mono tabular-nums">
                    {formatDate(req.createdAt || req.date)}
                  </td>
                  
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase border inline-flex items-center gap-1.5 ${
                        req.status === 'Новая' ? 'bg-red-500/20 text-red-300 border-red-500/30 shadow-sm shadow-red-500/10' :
                        req.status === 'В работе' ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30 shadow-sm shadow-yellow-500/10' :
                        'bg-emerald-500/20 text-emerald-300 border-emerald-500/30 shadow-sm shadow-emerald-500/10'
                      }`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current" />
                        {req.status}
                      </span>
                      
                      {/* Quick status change buttons */}
                      {onUpdateStatus && (
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                          {req.status !== 'В работе' && (
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => onUpdateStatus(req.id, 'В работе')}
                              className="p-1.5 hover:bg-yellow-500/20 rounded-lg text-yellow-400 transition-all border border-transparent hover:border-yellow-500/30"
                              title="В работу"
                            >
                              <Clock size={15} />
                            </motion.button>
                          )}
                          {req.status !== 'Завершена' && (
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => onUpdateStatus(req.id, 'Завершена')}
                              className="p-1.5 hover:bg-emerald-500/20 rounded-lg text-emerald-400 transition-all border border-transparent hover:border-emerald-500/30"
                              title="Завершить"
                            >
                              <CheckCircle size={15} />
                            </motion.button>
                          )}
                        </div>
                      )}
                    </div>
                  </td>
                  
                  <td className="p-4 text-right pr-6">
                    <div className="flex items-center justify-end gap-2">
                      <motion.button 
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => onView(req.id)} 
                        className="text-white/40 hover:text-blue-400 transition-all p-2 hover:bg-blue-500/20 rounded-lg border border-transparent hover:border-blue-500/30"
                        title="Просмотр"
                      >
                        <Eye size={18} />
                      </motion.button>
                      {onDelete && (
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => {
                            if (confirm(`Удалить заявку от ${req.user}?`)) {
                              onDelete(req.id);
                            }
                          }}
                          className="text-white/40 hover:text-red-400 transition-all p-2 hover:bg-red-500/20 rounded-lg opacity-0 group-hover:opacity-100 border border-transparent hover:border-red-500/30"
                          title="Удалить"
                        >
                          <Trash2 size={18} />
                        </motion.button>
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