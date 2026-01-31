import { Employee } from '@/entities/request/model/store';
import { Pencil, Trash2, User, Mail, Phone, Ruler } from 'lucide-react';

interface EmployeesTableProps {
  employees: Employee[];
  onEdit: (employee: Employee) => void;
  onDelete: (id: string) => void;
}

export const EmployeesTable = ({ employees, onEdit, onDelete }: EmployeesTableProps) => {
  return (
    <div className="overflow-auto max-h-[600px] custom-scrollbar">
      <table className="w-full text-left border-collapse">
        <thead className="bg-[#1a1f2e] sticky top-0 z-10 shadow-lg shadow-black/20">
          <tr className="text-[10px] uppercase tracking-widest text-white/40 font-black">
            <th className="p-4 pl-6">ФИО</th>
            <th className="p-4">Отдел</th>
            <th className="p-4">Должность</th>
            <th className="p-4">Контакты</th>
            <th className="p-4">Размеры</th>
            <th className="p-4 text-right pr-6">Действия</th>
          </tr>
        </thead>
        <tbody className="text-sm text-white/90 divide-y divide-white/5">
          {employees.length === 0 ? (
            <tr>
              <td colSpan={6} className="p-12 text-center text-white/30">
                <User size={32} className="opacity-20 mx-auto mb-2" />
                <span>Нет сотрудников в базе</span>
              </td>
            </tr>
          ) : (
            employees.map((emp: Employee) => (
              <tr key={emp.id} className="hover:bg-white/[0.02] transition-colors group">
                {/* ФИО */}
                <td className="p-4 pl-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-300 font-bold">
                      {emp.fullName.charAt(0)}
                    </div>
                    <div>
                      <div className="font-bold text-white group-hover:text-indigo-400 transition-colors">
                        {emp.fullName}
                      </div>
                    </div>
                  </div>
                </td>

                {/* Отдел */}
                <td className="p-4">
                  <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase border bg-white/5 text-white/70 border-white/10">
                    {emp.department || '—'}
                  </span>
                </td>

                {/* Должность */}
                <td className="p-4 text-white/60">
                  {emp.position || '—'}
                </td>

                {/* Контакты */}
                <td className="p-4">
                  <div className="space-y-1">
                    {emp.email && (
                      <div className="flex items-center gap-2 text-xs text-white/50">
                        <Mail size={12} className="text-blue-400" />
                        <span className="truncate max-w-[150px]">{emp.email}</span>
                      </div>
                    )}
                    {emp.phone && (
                      <div className="flex items-center gap-2 text-xs text-white/50">
                        <Phone size={12} className="text-green-400" />
                        <span>{emp.phone}</span>
                      </div>
                    )}
                    {!emp.email && !emp.phone && (
                      <span className="text-white/30">—</span>
                    )}
                  </div>
                </td>

                {/* Размеры */}
                <td className="p-4">
                  {emp.clothingSize || emp.shoeSize || emp.height ? (
                    <div className="flex items-center gap-2">
                      <Ruler size={14} className="text-yellow-400" />
                      <div className="text-xs text-white/60 space-y-0.5">
                        {emp.clothingSize && (
                          <div>👕 {emp.clothingSize}</div>
                        )}
                        {emp.shoeSize && (
                          <div>👞 {emp.shoeSize}</div>
                        )}
                        {emp.height && (
                          <div>📏 {emp.height} см</div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <span className="text-white/30">—</span>
                  )}
                </td>

                {/* Действия */}
                <td className="p-4 text-right pr-6">
                  <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => onEdit(emp)}
                      className="text-white/30 hover:text-blue-400 transition-colors p-1.5 hover:bg-blue-500/10 rounded"
                      title="Редактировать"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Удалить сотрудника ${emp.fullName}?`)) {
                          onDelete(emp.id);
                        }
                      }}
                      className="text-white/30 hover:text-red-400 transition-colors p-1.5 hover:bg-red-500/10 rounded"
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
  );
};
