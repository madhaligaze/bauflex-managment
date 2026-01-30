import { useQuery } from '@tanstack/react-query';
import { ArrowDownLeft, ArrowUpRight, MoreHorizontal, Calendar, Search, Filter } from 'lucide-react';
import { Button } from '@/shared/ui/Button';
import { cn } from '@/shared/lib/utils'; // Убедись, что этот файл у тебя есть

// --- Types (в реальном проекте вынесем в @/entities/transaction) ---
interface Transaction {
  id: string;
  amount: number;
  currency: string;
  status: 'completed' | 'pending' | 'failed';
  date: string;
  recipient: string;
  type: 'income' | 'expense';
}

// --- Mock Data API ---
const fetchTransactions = async (): Promise<Transaction[]> => {
  // Имитация задержки сети 1.5 сек
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  return [
    { id: 'TX-001', amount: 12500, currency: 'KZT', status: 'completed', date: '2024-03-10', recipient: 'ИП Иванов', type: 'expense' },
    { id: 'TX-002', amount: 450000, currency: 'KZT', status: 'completed', date: '2024-03-09', recipient: 'OOO "TechSoft"', type: 'income' },
    { id: 'TX-003', amount: 3200, currency: 'KZT', status: 'pending', date: '2024-03-09', recipient: 'Cloud Services', type: 'expense' },
    { id: 'TX-004', amount: 15000, currency: 'KZT', status: 'failed', date: '2024-03-08', recipient: 'Office Rent', type: 'expense' },
    { id: 'TX-005', amount: 89000, currency: 'KZT', status: 'completed', date: '2024-03-08', recipient: 'Client Payment', type: 'income' },
  ];
};

export const TransactionTable = () => {
  // Хук TanStack Query сам управляет состоянием isLoading
  const { data, isLoading, isError } = useQuery({
    queryKey: ['transactions'],
    queryFn: fetchTransactions,
  });

  if (isError) return <div className="p-4 text-red-500 bg-red-50 rounded-lg">Ошибка загрузки данных</div>;

  return (
    <div className="space-y-4">
      {/* Панель фильтров (Адаптивная) */}
      <div className="flex flex-col sm:flex-row justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
          <input 
            type="text" 
            placeholder="Поиск транзакций..." 
            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" leftIcon={<Filter size={16} />}>Фильтр</Button>
          <Button>Экспорт</Button>
        </div>
      </div>

      {/* --- DESKTOP VIEW (Таблица) --- */}
      <div className="hidden md:block bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 border-b border-slate-100 text-slate-500">
            <tr>
              <th className="px-6 py-4 font-medium">Транзакция</th>
              <th className="px-6 py-4 font-medium">Получатель / Отправитель</th>
              <th className="px-6 py-4 font-medium">Дата</th>
              <th className="px-6 py-4 font-medium">Статус</th>
              <th className="px-6 py-4 font-medium text-right">Сумма</th>
              <th className="px-6 py-4 font-medium text-center">Действия</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading 
              ? [...Array(5)].map((_, i) => <DesktopSkeleton key={i} />)
              : data?.map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "h-8 w-8 rounded-full flex items-center justify-center",
                        tx.type === 'income' ? "bg-green-100 text-green-600" : "bg-slate-100 text-slate-600"
                      )}>
                        {tx.type === 'income' ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
                      </div>
                      <span className="font-medium text-slate-900">{tx.id}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-600">{tx.recipient}</td>
                  <td className="px-6 py-4 text-slate-500">{tx.date}</td>
                  <td className="px-6 py-4">
                    <StatusBadge status={tx.status} />
                  </td>
                  <td className={cn(
                    "px-6 py-4 text-right font-medium",
                    tx.type === 'income' ? "text-green-600" : "text-slate-900"
                  )}>
                    {tx.type === 'income' ? '+' : '-'}{tx.amount.toLocaleString()} ₸
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600">
                      <MoreHorizontal size={16} />
                    </button>
                  </td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>

      {/* --- MOBILE VIEW (Карточки) --- */}
      <div className="md:hidden space-y-3">
        {isLoading
          ? [...Array(3)].map((_, i) => <MobileSkeleton key={i} />)
          : data?.map((tx) => (
            <div key={tx.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                   <div className={cn(
                      "h-10 w-10 rounded-full flex items-center justify-center",
                      tx.type === 'income' ? "bg-green-100 text-green-600" : "bg-slate-100 text-slate-600"
                    )}>
                      {tx.type === 'income' ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />}
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{tx.recipient}</p>
                      <p className="text-xs text-slate-500">{tx.id}</p>
                    </div>
                </div>
                <StatusBadge status={tx.status} />
              </div>
              
              <div className="flex justify-between items-center border-t border-slate-50 pt-3 mt-2">
                <div className="flex items-center text-xs text-slate-400 gap-1">
                  <Calendar size={14} />
                  {tx.date}
                </div>
                <span className={cn(
                  "font-bold text-lg",
                  tx.type === 'income' ? "text-green-600" : "text-slate-900"
                )}>
                  {tx.type === 'income' ? '+' : '-'}{tx.amount.toLocaleString()} ₸
                </span>
              </div>
            </div>
          ))
        }
      </div>
    </div>
  );
};

// --- Вспомогательные компоненты ---

const StatusBadge = ({ status }: { status: string }) => {
  const styles = {
    completed: "bg-green-50 text-green-700 border-green-200",
    pending: "bg-amber-50 text-amber-700 border-amber-200",
    failed: "bg-red-50 text-red-700 border-red-200",
  };
  const labels = { completed: 'Успешно', pending: 'В обработке', failed: 'Ошибка' };
  
  return (
    <span className={cn("px-2.5 py-0.5 rounded-full text-xs font-medium border", styles[status as keyof typeof styles])}>
      {labels[status as keyof typeof labels] || status}
    </span>
  );
};

// Скелетон для Десктопа
const DesktopSkeleton = () => (
  <tr className="animate-pulse">
    <td className="px-6 py-4"><div className="h-4 w-24 bg-slate-100 rounded"></div></td>
    <td className="px-6 py-4"><div className="h-4 w-32 bg-slate-100 rounded"></div></td>
    <td className="px-6 py-4"><div className="h-4 w-20 bg-slate-100 rounded"></div></td>
    <td className="px-6 py-4"><div className="h-6 w-20 bg-slate-100 rounded-full"></div></td>
    <td className="px-6 py-4"><div className="h-4 w-16 bg-slate-100 rounded ml-auto"></div></td>
    <td className="px-6 py-4"></td>
  </tr>
);

// Скелетон для Мобильного
const MobileSkeleton = () => (
  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-4 animate-pulse">
    <div className="flex justify-between">
      <div className="flex gap-3">
        <div className="h-10 w-10 bg-slate-100 rounded-full"></div>
        <div className="space-y-2">
          <div className="h-4 w-32 bg-slate-100 rounded"></div>
          <div className="h-3 w-20 bg-slate-100 rounded"></div>
        </div>
      </div>
      <div className="h-6 w-16 bg-slate-100 rounded-full"></div>
    </div>
    <div className="h-4 w-full bg-slate-100 rounded"></div>
  </div>
);