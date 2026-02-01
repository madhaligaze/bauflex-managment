import { useState, useEffect } from 'react';
import { useBauflexStore, RequestEntry, Employee } from '@/entities/request/model/store'; 
import { Card } from '@/shared/ui/Card';
import { Button } from '@/shared/ui/Button';
import { exportToExcel, exportToPDF } from '@/shared/lib/exportService';
import { EmployeeEditModal } from '@/widgets/admin/EmployeeEditModal';

// Модульные компоненты
import { RefreshButton } from './components/RefreshButton';
import { RequestsTable } from './components/RequestsTable';
import { RequestDetails } from './components/RequestDetails';
import { EmployeesTable } from './components/EmployeesTable';
import { Dashboard } from './components/Dashboard';

import { 
  LayoutDashboard, FileSpreadsheet,
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
  
  const [activeTab, setActiveTab] = useState<'dashboard' | 'requests' | 'users' | 'security'>(() => {
    const saved = localStorage.getItem('adminActiveTab');
    return (saved as any) || 'dashboard';
  });

  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [securityData, setSecurityData] = useState({ old: '', new: '' });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    fetchRequests();
    fetchEmployees();
  }, []);

  useEffect(() => {
    localStorage.setItem('adminActiveTab', activeTab);
  }, [activeTab]);

  const selectedRequest = requests.find((r: RequestEntry) => r.id === selectedRequestId);

  const filteredRequests = requests.filter((req: RequestEntry) => {
    const matchesSearch = req.user.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || req.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

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
    if (deleteRequest) await deleteRequest(id);
  };

  const handleUpdateRequestStatus = async (id: string, status: RequestEntry['status']) => {
    await updateStatus(id, status);
  };

  const handleChangePassword = async () => {
    if (!securityData.old || !securityData.new) {
      alert('Заполните все поля');
      return;
    }
    alert('Пароль успешно обновлен (демо)');
    setSecurityData({ old: '', new: '' });
  };

  const handleTabChange = (tab: typeof activeTab) => {
    setActiveTab(tab);
    setIsMobileMenuOpen(false);
  };

  // --- RENDERS ---

  const renderRequests = () => (
    <div className="h-full animate-in fade-in slide-in-from-right-4 duration-500 flex flex-col">
      {/* UPDATED CARD STYLE: 
         - Lighter background: bg-[#1a1f2e]/70 (instead of very dark #131722)
         - Glass effect: backdrop-blur-xl
         - Rounded corners: rounded-3xl
      */}
      <Card className="flex-1 bg-[#1a1f2e]/70 backdrop-blur-xl border border-white/10 p-0 overflow-hidden shadow-2xl flex flex-col rounded-3xl">
        
        {/* HEADER */}
        <div className="p-5 border-b border-white/5 bg-white/[0.02] space-y-4">
          {/* Row 1: Title & Export */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-red-500/10 rounded-xl border border-red-500/10">
                <FileSpreadsheet size={22} className="text-red-500" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white uppercase tracking-wide leading-none">Заявки</h2>
                <div className="flex items-center gap-2 mt-1.5">
                   <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
                   <span className="text-xs text-white/50 font-medium">Активных: {requests.length}</span>
                </div>
              </div>
            </div>

            {/* Buttons: Restored Outline Style + Better Visibility */}
            <div className="flex w-full md:w-auto gap-3">
              <Button 
                onClick={() => exportToExcel(requests)} 
                variant="secondary" 
                className="flex-1 md:flex-none h-10 bg-transparent border border-white/10 text-white/70 hover:bg-emerald-500/10 hover:text-emerald-400 hover:border-emerald-500/30 font-bold px-5 text-xs uppercase tracking-wider transition-all rounded-xl"
              >
                <FileSpreadsheet size={16} className="mr-2" />
                Excel
              </Button>
              <Button 
                onClick={() => exportToPDF(requests)} 
                variant="secondary" 
                className="flex-1 md:flex-none h-10 bg-transparent border border-white/10 text-white/70 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30 font-bold px-5 text-xs uppercase tracking-wider transition-all rounded-xl"
              >
                <FileSpreadsheet size={16} className="mr-2" />
                PDF
              </Button>
            </div>
          </div>

          {/* Row 2: Search & Refresh */}
          <div className="flex flex-col md:flex-row gap-4 items-center">
             <div className="flex-shrink-0">
               <RefreshButton onRefresh={handleRefresh} lastUpdated={lastFetch} />
             </div>

             <div className="relative flex-1 w-full group">
               <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none transition-colors group-focus-within:text-white">
                 <Search size={18} />
               </div>
               <input
                 type="text"
                 placeholder="Поиск по сотруднику..."
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
                 className="w-full h-11 bg-[#0f1219]/50 border border-white/10 rounded-xl pl-12 pr-4 text-white text-sm placeholder:text-white/20 focus:outline-none focus:ring-1 focus:ring-red-500/50 focus:border-red-500/50 transition-all hover:bg-[#0f1219]/80"
               />
             </div>
          </div>
        </div>

        {/* Table Content */}
        <div className="flex-1 overflow-hidden bg-transparent">
          <RequestsTable 
            requests={filteredRequests} 
            onView={(id) => setSelectedRequestId(id)} 
            onDelete={handleDeleteRequest}
            onUpdateStatus={handleUpdateRequestStatus}
          />
        </div>
      </Card>

      {/* Drawer */}
      {selectedRequest && (
        <RequestDetails 
          request={selectedRequest} 
          onClose={() => setSelectedRequestId(null)}
          onUpdateStatus={(status) => handleUpdateRequestStatus(selectedRequest.id, status)}
          onUpdate={async (data) => {
            if (updateRequest) await updateRequest(selectedRequest.id, data);
          }}
        />
      )}
    </div>
  );

  const renderDashboard = () => (
    <Dashboard 
      requests={requests} 
      employees={employees} 
      onNavigate={(tab, filter) => {
        setActiveTab(tab as any);
        if (filter && filter !== 'all') setStatusFilter(filter);
      }}
    />
  );

  const renderUsers = () => (
    <div className="h-full animate-in fade-in slide-in-from-right-4 duration-500 flex flex-col">
      <Card className="flex-1 bg-[#1a1f2e]/70 backdrop-blur-xl border border-white/10 p-0 overflow-hidden shadow-2xl flex flex-col rounded-3xl">
        <div className="p-5 border-b border-white/5 bg-white/[0.02] flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 self-start md:self-center">
            <div className="p-2.5 bg-indigo-500/10 rounded-xl border border-indigo-500/10">
              <Users size={22} className="text-indigo-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white uppercase tracking-wide leading-none">Сотрудники</h2>
              <span className="text-xs text-white/40 mt-1 block">База персонала</span>
            </div>
          </div>
          <Button
            onClick={() => handleOpenEditModal()}
            className="w-full md:w-auto bg-red-600 hover:bg-red-500 h-10 text-sm font-bold uppercase tracking-wider rounded-xl shadow-lg shadow-red-900/20"
          >
            <UserPlus size={16} className="mr-2" />
            Добавить
          </Button>
        </div>

        <div className="flex-1 overflow-hidden bg-transparent">
          <EmployeesTable 
            employees={employees} 
            onEdit={handleOpenEditModal}
            onDelete={async (id) => {
              if (confirm('Удалить сотрудника?')) await removeEmployee(id);
            }}
          />
        </div>
      </Card>
      
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

  const renderSecurity = () => (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
      <Card className="bg-[#1a1f2e]/70 backdrop-blur-xl border border-white/10 p-8 shadow-2xl rounded-3xl">
        <div className="flex items-center gap-5 mb-8">
          <div className="w-14 h-14 bg-red-500/10 rounded-2xl flex items-center justify-center border border-red-500/20 shadow-inner">
            <Lock size={28} className="text-red-500" />
          </div>
          <div>
            <h3 className="text-2xl font-black text-white uppercase tracking-wide">Безопасность</h3>
            <p className="text-white/50 text-sm mt-1">Смена пароля администратора</p>
          </div>
        </div>

        <div className="space-y-5">
          <div>
            <label className="block text-white/60 text-[10px] font-bold mb-2 uppercase tracking-widest pl-1">Текущий пароль</label>
            <input
              type="password"
              value={securityData.old}
              onChange={(e) => setSecurityData({ ...securityData, old: e.target.value })}
              className="w-full px-4 py-3.5 bg-[#0f1219]/50 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-red-500/50 focus:bg-[#0f1219] transition-all"
              placeholder="••••••••"
            />
          </div>

          <div>
            <label className="block text-white/60 text-[10px] font-bold mb-2 uppercase tracking-widest pl-1">Новый пароль</label>
            <input
              type="password"
              value={securityData.new}
              onChange={(e) => setSecurityData({ ...securityData, new: e.target.value })}
              className="w-full px-4 py-3.5 bg-[#0f1219]/50 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-red-500/50 focus:bg-[#0f1219] transition-all"
              placeholder="••••••••"
            />
          </div>

          <Button
            onClick={handleChangePassword}
            className="w-full bg-red-600 hover:bg-red-500 h-12 font-bold uppercase tracking-wide text-sm mt-4 rounded-xl shadow-lg shadow-red-900/20"
          >
            Обновить пароль
          </Button>
        </div>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#050608] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-[#050608] to-[#050608] p-4 md:p-6 text-slate-200">
      <div className="max-w-[1600px] mx-auto">
        
        {/* Top Bar - RESTORED ORIGINAL TITLE STYLE */}
        <div className="flex items-center justify-between mb-8 px-2">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-white uppercase tracking-wider leading-tight">
              Записи сотрудников
            </h1>
            <p className="text-white/30 text-[10px] md:text-xs tracking-[0.2em] uppercase font-bold mt-1.5 ml-0.5">
              BAUFLEX Management System
            </p>
          </div>
          
          <div className="flex items-center gap-3">
             <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden w-10 h-10 flex items-center justify-center bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 text-white transition-colors"
            >
              {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            
            <Button 
              onClick={onLogout}
              variant="secondary"
              className="hidden lg:flex bg-transparent border border-white/10 hover:bg-white/5 hover:border-white/20 text-white/60 hover:text-white h-10 px-6 font-bold uppercase text-[10px] tracking-widest rounded-xl transition-all"
            >
              <LogOut size={14} className="mr-2" />
              Выход
            </Button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="hidden lg:flex gap-2 mb-8 p-1.5 bg-[#1a1f2e]/50 border border-white/5 rounded-2xl w-fit backdrop-blur-sm">
          {[
            { id: 'dashboard', label: 'Панель управления', icon: LayoutDashboard },
            { id: 'requests', label: 'Заявки', icon: FileSpreadsheet },
            { id: 'users', label: 'Сотрудники', icon: Users },
            { id: 'security', label: 'Безопасность', icon: Lock }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id as any)}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold uppercase text-xs tracking-wider transition-all duration-300 ${
                  isActive
                    ? 'bg-red-600 text-white shadow-lg shadow-red-900/20'
                    : 'text-white/40 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon size={16} className={isActive ? 'text-white' : 'opacity-70'} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="lg:hidden mb-6 bg-[#1a1f2e] border border-white/10 rounded-2xl p-2 animate-in slide-in-from-top-2">
            {[
                { id: 'dashboard', label: 'Панель управления', icon: LayoutDashboard },
                { id: 'requests', label: 'Заявки', icon: FileSpreadsheet },
                { id: 'users', label: 'Сотрудники', icon: Users },
                { id: 'security', label: 'Безопасность', icon: Lock }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id as any)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm mb-1 ${
                  activeTab === tab.id ? 'bg-red-600 text-white' : 'text-white/60'
                }`}
              >
                <tab.icon size={18} />
                {tab.label}
              </button>
            ))}
            <button onClick={onLogout} className="w-full flex items-center gap-3 px-4 py-3 text-red-400 font-bold text-sm mt-2 border-t border-white/5 pt-4">
              <LogOut size={18} /> Выйти
            </button>
          </div>
        )}

        {/* Content Area */}
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