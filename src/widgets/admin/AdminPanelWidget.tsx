import { useState, useEffect } from 'react';
import { useBauflexStore, RequestEntry, Employee } from '@/entities/request/model/store'; 
import { Card } from '@/shared/ui/Card';
import { Button } from '@/shared/ui/Button';
import { Drawer } from '@/shared/ui/Drawer';
import { exportToExcel, exportToPDF } from '@/shared/lib/exportService';
import { EmployeeEditModal } from '@/widgets/admin/EmployeeEditModal';

// Модульные компоненты
import { RefreshButton } from './components/RefreshButton';
import { RequestsTable } from './components/RequestsTable';
import { RequestDetails } from './components/RequestDetails';
import { EmployeesTable } from './components/EmployeesTable';
import { Dashboard } from './components/Dashboard';

import { 
  LayoutDashboard, FileSpreadsheet, FileType, 
  Search, Users, UserPlus, Lock, LogOut, Menu, X
} from 'lucide-react';

export const AdminPanelWidget = ({ onLogout }: { onLogout: () => void }) => {
  const { 
    requests, 
    updateStatus, 
    updateRequest,
    deleteRequest,
    employees, 
    addEmployee, 
    updateEmployee, 
    removeEmployee,
    fetchRequests,
    fetchEmployees,
    lastFetch
  } = useBauflexStore();
  
  // Восстановление activeTab из localStorage
  const [activeTab, setActiveTab] = useState<'dashboard' | 'requests' | 'users' | 'security'>(() => {
    const saved = localStorage.getItem('adminActiveTab');
    return (saved as any) || 'dashboard';
  });

  // Фильтрация по статусу
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  
  // Состояния для модалки редактирования сотрудника
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  
  // Поиск
  const [searchQuery, setSearchQuery] = useState('');
  const [securityData, setSecurityData] = useState({ old: '', new: '' });

  // Мобильное меню
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Загружаем данные при монтировании
  useEffect(() => {
    fetchRequests();
    fetchEmployees();
  }, []);

  // Сохраняем активную вкладку при изменении
  useEffect(() => {
    localStorage.setItem('adminActiveTab', activeTab);
  }, [activeTab]);

  const selectedRequest = requests.find((r: RequestEntry) => r.id === selectedRequestId);

  // Фильтрация заявок (поиск + статус)
  const filteredRequests = requests.filter((req: RequestEntry) => {
    const matchesSearch = req.user.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || req.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // --- ОБРАБОТЧИКИ ---

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
    
    console.log('Changing password for admin');
    alert('Пароль успешно обновлен (демо)');
    setSecurityData({ old: '', new: '' });
  };

  const handleTabChange = (tab: typeof activeTab) => {
    setActiveTab(tab);
    setIsMobileMenuOpen(false);
  };

  // ==========================================
  // RENDER: DASHBOARD
  // ==========================================
  const renderDashboard = () => (
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
        <div className="p-3 md:p-4 border-b border-white/5 bg-white/5 space-y-3">
          {/* Первая строка: заголовок и кнопки */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 justify-between">
            <div className="flex items-center gap-2 text-white/80">
              <FileSpreadsheet size={18} className="text-red-500 flex-shrink-0" />
              <span className="font-bold tracking-widest text-xs sm:text-sm uppercase">Заявки</span>
              <span className="bg-white/10 text-[10px] px-2 py-0.5 rounded-full text-white/50">
                {filteredRequests.length}
              </span>
            </div>

            {/* Кнопки Export - улучшенная видимость на Desktop */}
            <div className="flex gap-2 w-full sm:w-auto">
              <Button 
                onClick={() => exportToExcel(requests)} 
                variant="secondary" 
                size="sm" 
                className="flex-1 sm:flex-none bg-white/5 border-white/10 text-white/90 hover:text-white hover:bg-emerald-500/30 hover:border-emerald-500/50 transition-all text-xs sm:text-sm h-9 sm:h-10 px-3 sm:px-4 font-bold"
              >
                <FileSpreadsheet size={16} className="mr-1.5" />
                <span className="uppercase tracking-wide">EXCEL</span>
              </Button>
              <Button 
                onClick={() => exportToPDF(requests)} 
                variant="secondary" 
                size="sm" 
                className="flex-1 sm:flex-none bg-white/5 border-white/10 text-white/90 hover:text-white hover:bg-red-500/30 hover:border-red-500/50 transition-all text-xs sm:text-sm h-9 sm:h-10 px-3 sm:px-4 font-bold"
              >
                <FileType size={16} className="mr-1.5" />
                <span className="uppercase tracking-wide">PDF</span>
              </Button>
            </div>
          </div>

          {/* Вторая строка: кнопка обновления и поиск */}
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Кнопка обновления */}
            <div className="flex-shrink-0">
              <RefreshButton
                onRefresh={handleRefresh}
                lastUpdated={lastFetch}
              />
            </div>

            {/* Поиск */}
            <div className="relative flex-1 group">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none z-10">
                <Search size={16} />
              </div>
              <input
                type="text"
                placeholder="Поиск по сотруднику..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-10 sm:h-11 bg-white/5 border border-white/10 rounded-xl pl-14 pr-4 text-white text-sm placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 transition-all hover:bg-white/10 hover:border-white/20"
              />
            </div>
          </div>

          {/* Фильтр по статусу */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-white/50 font-bold uppercase tracking-wider">Статус:</span>
            <div className="flex gap-1 sm:gap-2 flex-wrap">
              {[
                { value: 'all', label: 'Все' },
                { value: 'Новая', label: 'Новые' },
                { value: 'В работе', label: 'В работе' },
                { value: 'Завершена', label: 'Завершенные' }
              ].map((status) => (
                <button
                  key={status.value}
                  onClick={() => setStatusFilter(status.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide transition-all ${
                    statusFilter === status.value
                      ? 'bg-red-600 text-white shadow-lg shadow-red-600/30'
                      : 'bg-white/5 text-white/50 hover:text-white/80 hover:bg-white/10 border border-white/10'
                  }`}
                >
                  {status.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Таблица заявок */}
        <div className="flex-1 overflow-hidden">
          <RequestsTable 
            requests={filteredRequests} 
            onView={(id) => setSelectedRequestId(id)} 
            onDelete={handleDeleteRequest}
            onUpdateStatus={handleUpdateRequestStatus}
          />
        </div>
      </Card>

      {/* Drawer с деталями заявки */}
      {selectedRequest && (
        <RequestDetails 
          request={selectedRequest} 
          onClose={() => setSelectedRequestId(null)}
          onUpdateStatus={(status) => handleUpdateRequestStatus(selectedRequest.id, status)}
          onUpdate={async (data) => {
            if (updateRequest) {
              await updateRequest(selectedRequest.id, data);
            }
          }}
        />
      )}
    </div>
  );

  // ==========================================
  // RENDER: СОТРУДНИКИ
  // ==========================================
  const renderUsers = () => (
    <div className="h-full animate-in fade-in slide-in-from-right-4 duration-500 flex flex-col">
      <Card className="flex-1 bg-slate-900/60 backdrop-blur-3xl border-white/10 p-0 overflow-hidden shadow-2xl flex flex-col">
        <div className="p-4 border-b border-white/5 bg-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-white/80">
            <Users size={18} className="text-red-500" />
            <span className="font-bold tracking-widest text-sm uppercase">Сотрудники</span>
            <span className="bg-white/10 text-[10px] px-2 py-0.5 rounded-full text-white/50">
              {employees.length}
            </span>
          </div>
          <Button
            onClick={() => handleOpenEditModal()}
            className="bg-red-600 hover:bg-red-500 h-10 text-sm font-bold w-full sm:w-auto"
          >
            <UserPlus size={16} className="mr-2" />
            Добавить сотрудника
          </Button>
        </div>

        <div className="flex-1 overflow-hidden">
          <EmployeesTable 
            employees={employees} 
            onEdit={handleOpenEditModal}
            onDelete={async (id) => {
              if (confirm('Удалить сотрудника?')) {
                await removeEmployee(id);
              }
            }}
          />
        </div>
      </Card>

      {/* Модалка редактирования сотрудника */}
      {isEditModalOpen && (
        <EmployeeEditModal
          employee={editingEmployee}
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingEmployee(null);
          }}
          onSave={handleSaveEmployee}
        />
      )}
    </div>
  );

  // ==========================================
  // RENDER: БЕЗОПАСНОСТЬ
  // ==========================================
  const renderSecurity = () => (
    <div className="max-w-2xl mx-auto space-y-4 sm:space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
      <Card className="bg-slate-900/60 backdrop-blur-3xl border-white/10 p-4 sm:p-6 shadow-2xl">
        <div className="flex items-center gap-3 mb-4 sm:mb-6">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
            <Lock size={20} className="text-red-400 sm:w-6 sm:h-6" />
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-black text-white uppercase tracking-wide">Безопасность</h3>
            <p className="text-white/50 text-xs sm:text-sm">Управление паролем администратора</p>
          </div>
        </div>

        <div className="space-y-3 sm:space-y-4">
          <div>
            <label className="block text-white/70 text-xs sm:text-sm font-bold mb-2">Текущий пароль</label>
            <input
              type="password"
              value={securityData.old}
              onChange={(e) => setSecurityData({ ...securityData, old: e.target.value })}
              className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-red-500/50"
              placeholder="Введите текущий пароль"
            />
          </div>

          <div>
            <label className="block text-white/70 text-xs sm:text-sm font-bold mb-2">Новый пароль</label>
            <input
              type="password"
              value={securityData.new}
              onChange={(e) => setSecurityData({ ...securityData, new: e.target.value })}
              className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-red-500/50"
              placeholder="Введите новый пароль"
            />
          </div>

          <Button
            onClick={handleChangePassword}
            className="w-full bg-red-600 hover:bg-red-500 h-10 sm:h-12 font-bold uppercase tracking-wide text-xs sm:text-sm"
          >
            <Lock size={16} className="mr-2" />
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-3 sm:p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Шапка - адаптивная */}
        <div className="flex items-center justify-between mb-4 sm:mb-6 md:mb-8">
          <div className="flex-1 min-w-0">
            <h1 className="text-lg sm:text-2xl md:text-3xl font-black text-white uppercase tracking-wider mb-1 sm:mb-2 truncate">
              Панель администратора
            </h1>
            <p className="text-white/50 text-[10px] sm:text-xs md:text-sm">BAUFLEX Management System</p>
          </div>
          
          {/* Desktop: кнопка выхода, Mobile: меню-гамбургер */}
          <div className="flex items-center gap-2 ml-2">
            <Button 
              onClick={onLogout}
              variant="secondary"
              size="sm"
              className="hidden sm:flex bg-white/5 border-white/10 hover:bg-red-500/20 hover:border-red-500/30 h-9 sm:h-10"
            >
              <LogOut size={14} className="sm:mr-2" />
              <span className="hidden sm:inline">Выйти</span>
            </Button>

            {/* Мобильное меню-гамбургер */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden w-10 h-10 flex items-center justify-center bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors"
            >
              {isMobileMenuOpen ? <X size={20} className="text-white" /> : <Menu size={20} className="text-white" />}
            </button>
          </div>
        </div>

        {/* Desktop табы - скрыты на мобильных */}
        <div className="hidden lg:flex gap-2 mb-6 p-1 bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl">
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
                onClick={() => handleTabChange(tab.id as any)}
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

        {/* Мобильное выдвижное меню */}
        {isMobileMenuOpen && (
          <div className="lg:hidden mb-4 bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-2xl p-2 shadow-2xl animate-in slide-in-from-top-4 duration-300">
            <div className="space-y-1">
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
                    onClick={() => handleTabChange(tab.id as any)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${
                      activeTab === tab.id
                        ? 'bg-red-600 text-white shadow-lg shadow-red-600/30'
                        : 'text-white/70 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Icon size={18} />
                    {tab.label}
                  </button>
                );
              })}
              
              {/* Кнопка выхода в мобильном меню */}
              <button
                onClick={onLogout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all"
              >
                <LogOut size={18} />
                Выйти
              </button>
            </div>
          </div>
        )}

        {/* Компактная навигация для планшетов (средние экраны) */}
        <div className="hidden sm:flex lg:hidden gap-1 mb-4 p-1 bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl overflow-x-auto">
          {[
            { id: 'dashboard', label: 'Панель', icon: LayoutDashboard },
            { id: 'requests', label: 'Заявки', icon: FileSpreadsheet },
            { id: 'users', label: 'Сотрудники', icon: Users },
            { id: 'security', label: 'Безопасность', icon: Lock }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id as any)}
                className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold uppercase text-[10px] tracking-wider transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-red-600 text-white shadow-lg shadow-red-600/30'
                    : 'text-white/50 hover:text-white/80 hover:bg-white/5'
                }`}
              >
                <Icon size={14} />
                <span className="hidden md:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Контент */}
        <div className="min-h-[400px] sm:min-h-[500px] md:min-h-[600px]">
          {activeTab === 'dashboard' && renderDashboard()}
          {activeTab === 'requests' && renderRequests()}
          {activeTab === 'users' && renderUsers()}
          {activeTab === 'security' && renderSecurity()}
        </div>
      </div>
    </div>
  );
};