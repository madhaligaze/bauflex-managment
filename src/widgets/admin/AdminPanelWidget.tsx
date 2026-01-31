import { useState, useEffect } from 'react';
import { useBauflexStore, RequestEntry, Employee } from '@/entities/request/model/store'; 
import { Card } from '@/shared/ui/Card';
import { Button } from '@/shared/ui/Button';
import { Drawer } from '@/shared/ui/Drawer';
import { exportToExcel, exportToPDF } from '@/shared/lib/exportService';
import { EmployeeEditModal } from '@/widgets/admin/EmployeeEditModal';

// Модульные компоненты
import { RefreshButton } from './components/RefreshButton'; // ✅ ШАГ 1: Импорт
import { RequestsTable } from './components/RequestsTable';
import { RequestDetails } from './components/RequestDetails';
import { EmployeesTable } from './components/EmployeesTable';
import { Dashboard } from './components/Dashboard';

import { 
  LayoutDashboard, FileSpreadsheet, FileType, 
  Search, Users, UserPlus, Lock, LogOut,
  Settings
} from 'lucide-react';

export const AdminPanelWidget = ({ onLogout }: { onLogout: () => void }) => {
  const { 
    requests, 
    updateStatus, 
    updateRequest, // ✅ ШАГ 6: Добавлен updateRequest
    deleteRequest,
    employees, 
    addEmployee, 
    updateEmployee, 
    removeEmployee,
    fetchRequests,
    fetchEmployees,
    lastFetch // ✅ Добавлено для RefreshButton
  } = useBauflexStore();
  
  // ✅ ШАГ 2: Обновлен useState для activeTab (восстановление из localStorage)
  const [activeTab, setActiveTab] = useState<'dashboard' | 'requests' | 'users' | 'security'>(() => {
    const saved = localStorage.getItem('adminActiveTab');
    return (saved as any) || 'dashboard';
  });

  // ✅ ШАГ 8: Добавлен state для фильтрации
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  
  // Состояния для модалки редактирования сотрудника
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  
  // Поиск
  const [searchQuery, setSearchQuery] = useState('');
  const [securityData, setSecurityData] = useState({ old: '', new: '' });

  // Загружаем данные при монтировании
  useEffect(() => {
    fetchRequests();
    fetchEmployees();
  }, []);

  // ✅ ШАГ 3: Сохраняем активную вкладку при изменении
  useEffect(() => {
    localStorage.setItem('adminActiveTab', activeTab);
  }, [activeTab]);

  const selectedRequest = requests.find((r: RequestEntry) => r.id === selectedRequestId);

  // ✅ ШАГ 8: Обновлена логика фильтрации (поиск + статус)
  const filteredRequests = requests.filter((req: RequestEntry) => {
    const matchesSearch = req.user.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || req.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // --- ОБРАБОТЧИКИ ---

  // ✅ ШАГ 4: Обработчик обновления
  const handleRefresh = async () => {
    await fetchRequests();
    await fetchEmployees();
  };

  const handleOpenEditModal = (emp: Employee | null = null) => {
    setEditingEmployee(emp);
    setIsEditModalOpen(true);
  };

  const handleSaveEmployee = async (data: Partial<Employee>) => {
    if (editingEmployee) {
      await updateEmployee(editingEmployee.id, data);
    } else {
      await addEmployee(data as Omit<Employee, 'id'>);
    }
    setIsEditModalOpen(false);
    setEditingEmployee(null);
  };

  const handleDeleteRequest = async (id: string) => {
    if (deleteRequest) {
      await deleteRequest(id);
    }
  };

  const handleUpdateRequestStatus = async (id: string, status: RequestEntry['status']) => {
    await updateStatus(id, status);
  };

  const handleChangePassword = async () => {
    if (!securityData.old || !securityData.new) {
      alert('Заполните все поля');
      return;
    }
    
    // TODO: Реализовать смену пароля через API
    console.log('Changing password for admin');
    alert('Пароль успешно обновлен (демо)');
    setSecurityData({ old: '', new: '' });
  };

  // ==========================================
  // RENDER: DASHBOARD
  // ==========================================
  const renderDashboard = () => (
    // ✅ ШАГ 9: Обновлен вызов Dashboard с onNavigate
    <Dashboard 
      requests={requests} 
      employees={employees} 
      onNavigate={(tab, filter) => {
        setActiveTab(tab as any);
        if (filter && filter !== 'all') {
          setStatusFilter(filter);
        }
      }}
    />
  );

  // ==========================================
  // RENDER: ЗАЯВКИ
  // ==========================================
  const renderRequests = () => (
    <div className="h-full animate-in fade-in slide-in-from-right-4 duration-500 flex flex-col">
      <Card className="flex-1 bg-slate-900/60 backdrop-blur-3xl border-white/10 p-0 overflow-hidden shadow-2xl flex flex-col">
        
        {/* Шапка с экспортом и поиском */}
        <div className="p-4 border-b border-white/5 bg-white/5 flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
            <div className="flex items-center gap-2 text-white/80">
              <FileSpreadsheet size={20} className="text-red-500" />
              <span className="font-bold tracking-widest text-sm uppercase">Заявки</span>
              <span className="bg-white/10 text-[10px] px-2 py-0.5 rounded-full text-white/50">
                {filteredRequests.length}
              </span>
            </div>
             
            <div className="h-4 w-px bg-white/10 hidden sm:block" />

            {/* ✅ ШАГ 5: Кнопка обновления */}
            <RefreshButton
              onRefresh={handleRefresh}
              lastUpdated={lastFetch} // ✅ ИСПРАВЛЕНО: используем lastUpdated и переменную из стора
            />

            {/* Разделитель */}
            <div className="h-4 w-px bg-white/10 hidden sm:block" />

            <div className="flex gap-2 w-full sm:w-auto">
              <Button 
                onClick={() => exportToExcel(requests)} 
                variant="secondary" 
                size="sm" 
                className="flex-1 sm:flex-none bg-white/5 border-white/10 text-white/70 hover:text-white hover:bg-emerald-500/20 transition-all text-[11px] h-9"
              >
                <FileSpreadsheet className="mr-2" size={14} /> EXCEL
              </Button>
              <Button 
                onClick={() => exportToPDF(requests)} 
                variant="secondary" 
                size="sm" 
                className="flex-1 sm:flex-none bg-white/5 border-white/10 text-white/70 hover:text-white hover:bg-red-500/20 transition-all text-[11px] h-9"
              >
                <FileType className="mr-2" size={14} /> PDF
              </Button>
            </div>
          </div>

          {/* Поиск */}
          <div className="relative w-full md:w-72 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-red-400 transition-colors" size={16} />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск по сотруднику..." 
              className="w-full bg-black/20 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-1 focus:ring-red-500/50 focus:border-red-500/50 transition-all h-10"
            />
          </div>
        </div>

        {/* Таблица заявок */}
        <RequestsTable
          requests={filteredRequests}
          onView={setSelectedRequestId}
          onDelete={handleDeleteRequest}
          onUpdateStatus={handleUpdateRequestStatus}
        />
      </Card>

      {/* Drawer с деталями заявки */}
      {selectedRequest && (
        <RequestDetails
          request={selectedRequest}
          onClose={() => setSelectedRequestId(null)}
          onUpdateStatus={(status) => {
            handleUpdateRequestStatus(selectedRequest.id, status);
            setSelectedRequestId(null);
          }}
          // ✅ ШАГ 7: Добавлен prop onUpdate
          onUpdate={async (data) => {
            if (updateRequest) {
              await updateRequest(selectedRequest.id, data);
            }
            setSelectedRequestId(null);
          }}
        />
      )}
    </div>
  );

  // ==========================================
  // RENDER: СОТРУДНИКИ
  // ==========================================
  const renderUsers = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
      {/* Кнопка добавления */}
      <Card className="bg-gradient-to-br from-indigo-600 to-indigo-800 border-indigo-500/30 p-6 shadow-2xl shadow-indigo-900/40">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <UserPlus size={24} className="text-white" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white uppercase tracking-widest">Новый сотрудник</h3>
              <p className="text-white/60 text-xs font-medium mt-1">Добавить сотрудника в базу данных</p>
            </div>
          </div>
          <Button 
            onClick={() => handleOpenEditModal(null)}
            className="bg-white text-indigo-900 hover:bg-gray-100 h-12 px-8 font-bold uppercase text-xs tracking-widest shadow-lg"
          >
            <UserPlus size={16} className="mr-2" />
            Добавить
          </Button>
        </div>
      </Card>

      {/* Таблица сотрудников */}
      <Card className="bg-slate-900/60 backdrop-blur-3xl border-white/10 p-0 overflow-hidden shadow-2xl">
        <div className="p-4 border-b border-white/5 bg-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2 text-white/80">
            <Users size={20} className="text-indigo-500" />
            <span className="font-bold tracking-widest text-sm uppercase">Сотрудники</span>
            <span className="bg-white/10 text-[10px] px-2 py-0.5 rounded-full text-white/50">
              {employees.length}
            </span>
          </div>
        </div>

        <EmployeesTable
          employees={employees}
          onEdit={handleOpenEditModal}
          onDelete={removeEmployee}
        />
      </Card>

      {/* Модалка редактирования */}
      {isEditModalOpen && (
        <EmployeeEditModal
          employee={editingEmployee}
          onSave={handleSaveEmployee}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingEmployee(null);
          }} 
          isOpen={isEditModalOpen}
        />
      )}
    </div>
  );

  // ==========================================
  // RENDER: БЕЗОПАСНОСТЬ
  // ==========================================
  const renderSecurity = () => (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
      <Card className="bg-slate-900/60 backdrop-blur-3xl border-white/10 p-6 shadow-2xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center">
            <Lock size={24} className="text-red-400" />
          </div>
          <div>
            <h3 className="text-xl font-black text-white uppercase tracking-wide">Безопасность</h3>
            <p className="text-white/50 text-sm">Управление паролем администратора</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-white/70 text-sm font-bold mb-2">Текущий пароль</label>
            <input
              type="password"
              value={securityData.old}
              onChange={(e) => setSecurityData({ ...securityData, old: e.target.value })}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-red-500/50"
              placeholder="Введите текущий пароль"
            />
          </div>

          <div>
            <label className="block text-white/70 text-sm font-bold mb-2">Новый пароль</label>
            <input
              type="password"
              value={securityData.new}
              onChange={(e) => setSecurityData({ ...securityData, new: e.target.value })}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-red-500/50"
              placeholder="Введите новый пароль"
            />
          </div>

          <Button
            onClick={handleChangePassword}
            className="w-full bg-red-600 hover:bg-red-500 h-12 font-bold uppercase tracking-wide"
          >
            <Lock size={18} className="mr-2" />
            Изменить пароль
          </Button>
        </div>
      </Card>
    </div>
  );

  // ==========================================
  // ГЛАВНЫЙ РЕНДЕР
  // ==========================================
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Шапка */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black text-white uppercase tracking-wider mb-2">
              Панель администратора
            </h1>
            <p className="text-white/50 text-sm">BAUFLEX Management System</p>
          </div>
          <Button 
            onClick={onLogout}
            variant="secondary"
            className="bg-white/5 border-white/10 hover:bg-red-500/20 hover:border-red-500/30"
          >
            <LogOut size={16} className="mr-2" />
            Выйти
          </Button>
        </div>

        {/* Табы */}
        <div className="flex gap-2 mb-6 p-1 bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl">
          {[
            { id: 'dashboard', label: 'Панель управления', icon: LayoutDashboard },
            { id: 'requests', label: 'Заявки', icon: FileSpreadsheet },
            { id: 'users', label: 'Сотрудники', icon: Users },
            { id: 'security', label: 'Безопасность', icon: Lock }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold uppercase text-xs tracking-wider transition-all ${
                  activeTab === tab.id
                    ? 'bg-red-600 text-white shadow-lg shadow-red-600/30'
                    : 'text-white/50 hover:text-white/80 hover:bg-white/5'
                }`}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Контент */}
        <div className="min-h-[600px]">
          {activeTab === 'dashboard' && renderDashboard()}
          {activeTab === 'requests' && renderRequests()}
          {activeTab === 'users' && renderUsers()}
          {activeTab === 'security' && renderSecurity()}
        </div>
      </div>
    </div>
  );
};