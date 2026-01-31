import { useMemo } from 'react';
import { RequestEntry, Employee } from '@/entities/request/model/store';
import { Card } from '@/shared/ui/Card';
import { 
  FileSpreadsheet, Users, Clock, CheckCircle, 
  TrendingUp, Package, AlertCircle, Calendar, ArrowRight 
} from 'lucide-react';
import { formatDateOnly } from '@/shared/lib/dateFormatter';

// ✅ ШАГ 1: Обновлен интерфейс props
interface DashboardProps {
  requests: RequestEntry[];
  employees: Employee[];
  onNavigate?: (tab: string, filter?: string) => void;
}

// ✅ ШАГ 2: Добавлен onNavigate в деструктуризацию
export const Dashboard = ({ requests, employees, onNavigate }: DashboardProps) => {
  const stats = useMemo(() => {
    const today = new Date();
    const thisMonth = today.getMonth();
    const thisYear = today.getFullYear();

    const requestsThisMonth = requests.filter(r => {
      const date = new Date(r.createdAt || r.date);
      return date.getMonth() === thisMonth && date.getFullYear() === thisYear;
    });

    return {
      total: requests.length,
      new: requests.filter(r => r.status === 'Новая').length,
      inProgress: requests.filter(r => r.status === 'В работе').length,
      completed: requests.filter(r => r.status === 'Завершена').length,
      thisMonth: requestsThisMonth.length,
      bySiz: requests.filter(r => r.type === 'siz').length,
      byTools: requests.filter(r => r.type === 'tools').length,
      byEquipment: requests.filter(r => r.type === 'equipment').length,
      byConsumables: requests.filter(r => r.type === 'consumables').length,
      totalEmployees: employees.length
    };
  }, [requests, employees]);

  // ✅ ШАГ 3-6: Обновленный компонент StatCard с поддержкой onClick
  const StatCard = ({ 
    icon: Icon, 
    label, 
    value, 
    color, 
    trend,
    onClick // Новый prop
  }: { 
    icon: any; 
    label: string; 
    value: number; 
    color: string;
    trend?: string;
    onClick?: () => void;
  }) => {
    // Если передан onClick, рендерим как кнопку, иначе как div
    const Component = onClick ? 'button' : 'div';
    
    return (
      <Component 
        onClick={onClick}
        className={`w-full text-left relative group ${
          onClick ? 'cursor-pointer focus:outline-none' : ''
        }`}
      >
        <Card className={`${color} border p-6 shadow-lg transition-all duration-300 ${
          onClick ? 'group-hover:scale-105 group-hover:shadow-xl group-active:scale-95' : 'hover:scale-105'
        }`}>
          {/* Индикатор кликабельности (стрелочка) */}
          {onClick && (
            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <ArrowRight size={18} className="text-white/40" />
            </div>
          )}

          <div className="flex items-start justify-between mb-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-white/10 backdrop-blur-sm`}>
              <Icon size={24} className="text-white" />
            </div>
            {trend && (
              <div className="flex items-center gap-1 px-2 py-1 bg-white/10 rounded-lg">
                <TrendingUp size={12} className="text-white" />
                <span className="text-xs text-white font-bold">{trend}</span>
              </div>
            )}
          </div>
          <div className="text-4xl font-black text-white mb-1">{value}</div>
          <div className="text-white/60 text-sm font-medium uppercase tracking-wide">{label}</div>
        </Card>
      </Component>
    );
  };

  const RecentRequests = () => {
    const recent = [...requests]
      .sort((a, b) => {
        const dateA = new Date(a.createdAt || a.date).getTime();
        const dateB = new Date(b.createdAt || b.date).getTime();
        return dateB - dateA;
      })
      .slice(0, 5);

    return (
      <Card className="bg-slate-900/60 backdrop-blur-3xl border-white/10 p-6 shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <Calendar className="text-blue-400" size={20} />
          <h3 className="text-white font-bold uppercase tracking-wide">Последние заявки</h3>
        </div>
        <div className="space-y-3">
          {recent.map((req) => (
            <div 
              key={req.id}
              // Делаем строки таблицы тоже кликабельными для перехода к деталям (через фильтр)
              onClick={() => onNavigate?.('requests', 'all')}
              className="flex items-center justify-between p-3 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition-all group cursor-pointer"
            >
              <div className="flex items-center gap-3 flex-1">
                <div className={`w-2 h-2 rounded-full animate-pulse ${
                    req.status === 'Новая' ? 'bg-red-500' : 
                    req.status === 'В работе' ? 'bg-yellow-500' : 'bg-emerald-500'
                }`}></div>
                <div className="flex-1">
                  <div className="text-white font-semibold group-hover:text-red-400 transition-colors">
                    {req.user}
                  </div>
                  <div className="text-xs text-white/40">
                    {formatDateOnly(req.createdAt || req.date)}
                  </div>
                </div>
              </div>
              <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                req.status === 'Новая' ? 'bg-red-500/20 text-red-300' :
                req.status === 'В работе' ? 'bg-yellow-500/20 text-yellow-300' :
                'bg-emerald-500/20 text-emerald-300'
              }`}>
                {req.status}
              </span>
            </div>
          ))}
        </div>
      </Card>
    );
  };

  const CategoryBreakdown = () => {
    const categories = [
      { label: 'СИЗ', value: stats.bySiz, color: 'bg-blue-500', total: stats.total },
      { label: 'Инструменты', value: stats.byTools, color: 'bg-amber-500', total: stats.total },
      { label: 'Оборудование', value: stats.byEquipment, color: 'bg-indigo-500', total: stats.total },
      { label: 'Расходники', value: stats.byConsumables, color: 'bg-emerald-500', total: stats.total }
    ];

    return (
      <Card className="bg-slate-900/60 backdrop-blur-3xl border-white/10 p-6 shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <Package className="text-indigo-400" size={20} />
          <h3 className="text-white font-bold uppercase tracking-wide">Распределение по категориям</h3>
        </div>
        <div className="space-y-4">
          {categories.map((cat) => {
            const percentage = cat.total > 0 ? ((cat.value / cat.total) * 100).toFixed(1) : 0;
            return (
              <div key={cat.label} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/80 font-medium">{cat.label}</span>
                  <span className="text-white font-bold">{cat.value} ({percentage}%)</span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${cat.color} transition-all duration-500`}
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
      {/* Главные метрики - теперь кликабельные */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          icon={FileSpreadsheet}
          label="Всего заявок"
          value={stats.total}
          color="bg-gradient-to-br from-red-600 to-red-800 border-red-500/30"
          trend={`+${stats.thisMonth} этот месяц`}
          onClick={() => onNavigate?.('requests', 'all')}
        />
        <StatCard 
          icon={AlertCircle}
          label="Новые заявки"
          value={stats.new}
          color="bg-gradient-to-br from-orange-600 to-orange-800 border-orange-500/30"
          onClick={() => onNavigate?.('requests', 'Новая')}
        />
        <StatCard 
          icon={Clock}
          label="В работе"
          value={stats.inProgress}
          color="bg-gradient-to-br from-yellow-600 to-yellow-800 border-yellow-500/30"
          onClick={() => onNavigate?.('requests', 'В работе')}
        />
        <StatCard 
          icon={CheckCircle}
          label="Завершено"
          value={stats.completed}
          color="bg-gradient-to-br from-emerald-600 to-emerald-800 border-emerald-500/30"
          onClick={() => onNavigate?.('requests', 'Завершена')}
        />
      </div>

      {/* Вторая строка - Сотрудники и статистика */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Добавил навигацию и на карточку сотрудников */}
        <StatCard 
          icon={Users}
          label="Сотрудников в базе"
          value={stats.totalEmployees}
          color="bg-gradient-to-br from-indigo-600 to-indigo-800 border-indigo-500/30"
          onClick={() => onNavigate?.('users')} 
        />
        
        <div className="lg:col-span-2">
          <CategoryBreakdown />
        </div>
      </div>

      {/* Последние заявки */}
      <RecentRequests />
    </div>
  );
};