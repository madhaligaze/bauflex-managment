import { useState } from 'react';
import { useBauflexStore, RequestEntry, Employee } from '@/entities/request/model/store'; 
import { Card } from '@/shared/ui/Card';
import { Button } from '@/shared/ui/Button';
import { Input } from '@/shared/ui/Input';
import { Drawer } from '@/shared/ui/Drawer';
import { exportToExcel, exportToPDF } from '@/shared/lib/exportService';
import { EmployeeEditModal } from '@/widgets/admin/EmployeeEditModal';

import { 
  LayoutDashboard, FileSpreadsheet, FileType, 
  PlusSquare, Search, Users, ChevronRight, Eye, 
  CheckCircle, User, Trash2, UserPlus, Lock, LogOut,
  Pencil, Check, X, Filter
} from 'lucide-react';

export const AdminPanelWidget = ({ onLogout }: { onLogout: () => void }) => {
  const { requests, updateStatus, employees, addEmployee, updateEmployee, removeEmployee } = useBauflexStore();
  
  const [activeTab, setActiveTab] = useState<'requests' | 'users' | 'dashboard' | 'security'>('requests');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  
  // Состояния для модалки редактирования
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  
  // Состояние для поиска
  const [searchQuery, setSearchQuery] = useState('');
  const [securityData, setSecurityData] = useState({ old: '', new: '' });

  const selectedRequest = requests.find((r: RequestEntry) => r.id === selectedId);

  // Фильтрация заявок по поиску
  const filteredRequests = requests.filter(req => 
    req.user.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const typeMap: Record<string, { label: string; color: string }> = {
    siz: { label: 'СИЗ', color: 'bg-blue-500/10 text-blue-300 border-blue-500/20' },
    tools: { label: 'Инструменты', color: 'bg-amber-500/10 text-amber-300 border-amber-500/20' },
    equipment: { label: 'Оборудование', color: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20' },
    consumables: { label: 'Расходники', color: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20' },
  };

  // --- ЛОГИКА РЕДАКТИРОВАНИЯ ---
  const handleOpenEditModal = (emp: Employee | null = null) => {
    setEditingEmployee(emp);
    setIsEditModalOpen(true);
  };

  const handleSaveEmployee = async (data: Partial<Employee>) => {
    if (editingEmployee) {
      // Обновление существующего
      await updateEmployee(editingEmployee.id, data);
    } else {
      // Добавление нового
      await addEmployee(data as Omit<Employee, 'id'>);
    }
    setIsEditModalOpen(false);
    setEditingEmployee(null);
  };

  // --- ЛОГИКА СМЕНЫ ПАРОЛЯ ---
  const handleChangePassword = async () => {
    if (!securityData.old || !securityData.new) return alert('Заполните поля');
    try {
      console.log('Changing password for admin');
      alert('Пароль успешно обновлен (демо)');
      setSecurityData({ old: '', new: '' });
    } catch (e) {
      console.error(e);
    }
  };

  // ==========================================
  // RENDER: ЗАЯВКИ
  // ==========================================
  const renderRequests = () => (
    <div className="h-full animate-in fade-in slide-in-from-right-4 duration-500 flex flex-col">
      <Card className="flex-1 bg-slate-900/60 backdrop-blur-3xl border-white/10 p-0 overflow-hidden shadow-2xl flex flex-col">
        
        <div className="p-4 border-b border-white/5 bg-white/5 flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
             <div className="flex items-center gap-2 text-white/80">
                <FileSpreadsheet size={20} className="text-red-500" />
                <span className="font-bold tracking-widest text-sm uppercase">Заявки</span>
                <span className="bg-white/10 text-[10px] px-2 py-0.5 rounded-full text-white/50">{filteredRequests.length}</span>
             </div>
             
             <div className="h-4 w-px bg-white/10 hidden sm:block" />

             <div className="flex gap-2 w-full sm:w-auto">
              <Button onClick={() => exportToExcel(requests)} variant="secondary" size="sm" className="flex-1 sm:flex-none bg-white/5 border-white/10 text-white/70 hover:text-white hover:bg-emerald-500/20 transition-all text-[11px] h-9">
                <FileSpreadsheet className="mr-2" size={14} /> EXCEL
              </Button>
              <Button onClick={() => exportToPDF(requests)} variant="secondary" size="sm" className="flex-1 sm:flex-none bg-white/5 border-white/10 text-white/70 hover:text-white hover:bg-red-500/20 transition-all text-[11px] h-9">
                <FileType className="mr-2" size={14} /> PDF
              </Button>
            </div>
          </div>

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

        <div className="flex-1 overflow-auto custom-scrollbar relative">
          <table className="w-full text-left border-collapse">
            <thead className="bg-[#1a1f2e] sticky top-0 z-10 shadow-lg shadow-black/20">
              <tr className="text-[10px] uppercase tracking-widest text-white/40 font-black">
                <th className="p-4 pl-6">ФИО Сотрудника</th>
                <th className="p-4">Тип запроса</th>
                <th className="p-4">Дата создания</th>
                <th className="p-4">Статус</th>
                <th className="p-4 text-right pr-6">Действия</th>
              </tr>
            </thead>
            <tbody className="text-sm text-white/90 divide-y divide-white/5">
              {filteredRequests.length === 0 ? (
                 <tr>
                   <td colSpan={5} className="p-12 text-center text-white/30 flex flex-col items-center justify-center gap-2">
                     <Search size={32} className="opacity-20" />
                     <span>Ничего не найдено</span>
                   </td>
                 </tr>
              ) : (
                filteredRequests.map((req: RequestEntry) => (
                  <tr key={req.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="p-4 pl-6 font-bold text-white group-hover:text-red-400 transition-colors">
                      {req.user}
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase border ${typeMap[req.type]?.color || 'bg-white/10 text-white'}`}>
                        {typeMap[req.type]?.label || req.type}
                      </span>
                    </td>
                    <td className="p-4 text-white/60 text-xs">{req.date}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase ${
                        req.status === 'Новая' ? 'bg-red-500/20 text-red-300 border border-red-500/30' :
                        req.status === 'В работе' ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30' :
                        'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      }`}>
                        {req.status}
                      </span>
                    </td>
                    <td className="p-4 text-right pr-6">
                      <button onClick={() => setSelectedId(req.id)} className="text-white/30 hover:text-white transition-colors">
                        <Eye size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );

  // ==========================================
  // RENDER: СОТРУДНИКИ (ОБНОВЛЕННАЯ ВЕРСИЯ)
  // ==========================================
  const renderUsers = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
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

      <Card className="bg-slate-900/60 backdrop-blur-3xl border-white/10 p-0 overflow-hidden shadow-2xl">
        <div className="p-4 border-b border-white/5 bg-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2 text-white/80">
            <Users size={20} className="text-indigo-500" />
            <span className="font-bold tracking-widest text-sm uppercase">Сотрудники</span>
            <span className="bg-white/10 text-[10px] px-2 py-0.5 rounded-full text-white/50">{employees.length}</span>
          </div>
        </div>

        <div className="overflow-auto max-h-[500px] custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead className="bg-[#1a1f2e] sticky top-0 z-10">
              <tr className="text-[10px] uppercase tracking-widest text-white/40 font-black">
                <th className="p-4 pl-6">ФИО</th>
                <th className="p-4">Отдел</th>
                <th className="p-4">Должность</th>
                <th className="p-4">Контакты</th>
                <th className="p-4 text-right pr-6">Действия</th>
              </tr>
            </thead>
            <tbody className="text-sm text-white/90 divide-y divide-white/5">
              {employees.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-white/30">
                    <Users size={32} className="opacity-20 mx-auto mb-2" />
                    <span>Нет сотрудников</span>
                  </td>
                </tr>
              ) : (
                employees.map((emp: Employee) => (
                  <tr key={emp.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="p-4 pl-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-300 font-bold">
                          {emp.fullName.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-white group-hover:text-indigo-400 transition-colors">
                            {emp.fullName}
                          </div>
                          {emp.clothingSize && (
                            <div className="text-xs text-white/40 mt-0.5">
                              Одежда: {emp.clothingSize} • Обувь: {emp.shoeSize}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase border bg-white/5 text-white/70 border-white/10">
                        {emp.department}
                      </span>
                    </td>
                    <td className="p-4 text-white/60">{emp.position || '—'}</td>
                    <td className="p-4 text-white/50 text-xs">
                      {emp.email || emp.phone || '—'}
                    </td>
                    <td className="p-4 text-right pr-6">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => handleOpenEditModal(emp)}
                          className="p-2 text-white/20 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-all"
                          title="Редактировать"
                        >
                          <Pencil size={16} />
                        </button>
                        <button 
                          onClick={() => {
                            if (confirm(`Удалить сотрудника ${emp.fullName}?`)) {
                              removeEmployee(emp.id);
                            }
                          }}
                          className="p-2 text-white/20 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                          title="Удалить"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );

  // ==========================================
  // RENDER: БЕЗОПАСНОСТЬ
  // ==========================================
  const renderSecurity = () => (
    <div className="flex justify-center items-start pt-10 animate-in fade-in slide-in-from-right-4 duration-500">
      <Card className="w-full max-w-md bg-gradient-to-b from-slate-900 to-black border-white/10 p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-red-600/20 blur-[60px] rounded-full pointer-events-none" />
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 bg-red-500/10 rounded-xl text-red-500 border border-red-500/20">
            <Lock size={24} />
          </div>
          <div>
            <h3 className="text-lg font-black text-white uppercase tracking-widest">Безопасность</h3>
            <p className="text-white/40 text-xs font-medium">Управление доступом</p>
          </div>
        </div>
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] uppercase font-bold text-white/40 tracking-wider ml-1">Текущий пароль</label>
            <Input type="password" placeholder="••••••••" value={securityData.old} onChange={(e) => setSecurityData({...securityData, old: e.target.value})} className="bg-white/5 border-white/10 text-white h-12" />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] uppercase font-bold text-white/40 tracking-wider ml-1">Новый пароль</label>
            <Input type="password" placeholder="••••••••" value={securityData.new} onChange={(e) => setSecurityData({...securityData, new: e.target.value})} className="bg-white/5 border-white/10 text-white h-12" />
          </div>
          <Button onClick={handleChangePassword} className="w-full bg-red-600 hover:bg-red-700 h-12 text-xs font-black uppercase tracking-[0.15em] shadow-lg shadow-red-900/40 mt-4">
            Обновить пароль
          </Button>
        </div>
      </Card>
    </div>
  );

  // ==========================================
  // MAIN RETURN
  // ==========================================
  return (
    <>
      <div className="flex flex-col md:flex-row gap-6 animate-in fade-in duration-700 items-stretch min-h-[600px] h-[calc(100vh-100px)]">
        <aside className="w-full md:w-64 flex flex-col shrink-0">
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[24px] p-4 flex flex-col h-full shadow-2xl">
             <div className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] px-4 mb-6 mt-2">Меню</div>
             
             <div className="space-y-1">
               <AdminNavItem icon={LayoutDashboard} label="Обзор" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
               <AdminNavItem icon={FileSpreadsheet} label="Заявки" active={activeTab === 'requests'} onClick={() => setActiveTab('requests')} count={requests.filter(r => r.status === 'Новая').length} />
               <AdminNavItem icon={Users} label="Сотрудники" active={activeTab === 'users'} onClick={() => setActiveTab('users')} />
             </div>

             <div className="my-6 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
             
             <div className="space-y-1">
               <AdminNavItem icon={Lock} label="Безопасность" active={activeTab === 'security'} onClick={() => setActiveTab('security')} />
             </div>

             <div className="mt-auto space-y-3 pt-4">
               <button onClick={onLogout} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-red-500/10 text-white/40 hover:text-red-400 transition-all group">
                 <LogOut size={16} />
                 <span className="text-[10px] font-black uppercase tracking-widest">Выйти</span>
               </button>
             </div>
          </div>
        </aside>

        <main className="flex-1 w-full min-w-0 overflow-hidden flex flex-col">
          {activeTab === 'requests' && renderRequests()}
          {activeTab === 'users' && renderUsers()}
          {activeTab === 'security' && renderSecurity()}
          {activeTab === 'dashboard' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-500">
               <div className="p-8 bg-gradient-to-br from-red-600 to-red-800 rounded-[32px] border border-red-500/30 relative overflow-hidden group shadow-2xl shadow-red-900/30">
                  <div className="absolute right-0 top-0 p-32 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-700" />
                  <div className="relative z-10">
                    <div className="text-red-200 text-[10px] uppercase font-black tracking-widest mb-2">Новые заявки</div>
                    <div className="text-6xl text-white font-black tracking-tighter">
                      {requests.filter((r: RequestEntry) => r.status === 'Новая').length}
                    </div>
                    <div className="mt-4 text-xs font-bold text-red-100 flex items-center gap-2">
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse" /> Требуют внимания
                    </div>
                  </div>
               </div>
            </div>
          )}
        </main>

        <Drawer isOpen={!!selectedId} onClose={() => setSelectedId(null)} title={`Заявка #${selectedId}`}>
          {selectedRequest && (
            <div className="flex flex-col h-full">
               <div className="flex-1 space-y-6">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                     <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center text-slate-500">
                          <User size={24} />
                        </div>
                        <div>
                          <div className="text-xs text-slate-400 font-bold uppercase tracking-widest">Заявитель</div>
                          <div className="text-lg font-bold text-slate-800">{selectedRequest.user}</div>
                        </div>
                     </div>
                     <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-200">
                        <div>
                           <div className="text-[10px] text-slate-400 font-black uppercase tracking-wider mb-1">Тип</div>
                           <div className="text-sm font-bold text-slate-700 bg-white border px-2 py-1 rounded inline-block">{typeMap[selectedRequest.type]?.label}</div>
                        </div>
                        <div>
                           <div className="text-[10px] text-slate-400 font-black uppercase tracking-wider mb-1">Дата</div>
                           <div className="text-sm font-bold text-slate-700">{selectedRequest.date}</div>
                        </div>
                     </div>
                  </div>
               </div>
               
               <div className="pt-6 mt-auto">
                  <Button className="w-full h-14 bg-slate-900 hover:bg-black text-white rounded-xl font-bold shadow-xl flex items-center justify-center gap-2" onClick={() => { updateStatus(selectedId!, 'Завершена'); setSelectedId(null); }}>
                     <CheckCircle size={20} className="text-emerald-400" /> 
                     <span>Отметить как выданное</span>
                  </Button>
               </div>
            </div>
          )}
        </Drawer>
      </div>

      {/* Employee Edit Modal */}
      <EmployeeEditModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingEmployee(null);
        }}
        employee={editingEmployee}
        onSave={handleSaveEmployee}
      />
    </>
  );
};

const AdminNavItem = ({ icon: Icon, label, active, onClick, count }: any) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center justify-between px-4 py-3.5 rounded-[16px] transition-all duration-300 group relative overflow-hidden
      ${active ? 'bg-red-600 text-white shadow-lg shadow-red-600/30' : 'text-white/50 hover:bg-white/5 hover:text-white'}`}
  >
    <div className="flex items-center gap-3 relative z-10">
      <Icon size={18} className={active ? 'text-white' : 'text-white/40 group-hover:text-white transition-colors'} />
      <span className="text-[11px] font-bold tracking-widest uppercase">{label}</span>
    </div>
    <div className="flex items-center gap-2">
       {count > 0 && (
         <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md ${active ? 'bg-white/20 text-white' : 'bg-red-500 text-white'}`}>
           {count}
         </span>
       )}
       {active && <ChevronRight size={14} className="text-white/60" />}
    </div>
  </button>
);
