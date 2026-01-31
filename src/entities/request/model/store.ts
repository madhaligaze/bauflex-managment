import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { $api } from '@/shared/api/base';

// --- Types ---
export interface Employee {
  id: string;
  fullName: string;
  department: string;
  position: string;
  email?: string;
  phone?: string;
  clothingSize?: string;
  shoeSize?: string;
  height?: string;
}

export interface RequestEntry {
  id: string;
  type: 'siz' | 'tools' | 'equipment' | 'consumables';
  user: string;
  date: string;
  status: 'Новая' | 'В работе' | 'Завершена';
  details: any;
  createdAt?: string;
  requestNumber?: string;
}

interface BauflexStore {
  requests: RequestEntry[];
  employees: Employee[];
  isLoading: boolean;
  lastFetch: number; // Timestamp последнего обновления
  
  // Действия для заявок
  fetchRequests: () => Promise<void>;
  addRequest: (request: Omit<RequestEntry, 'id' | 'date' | 'status'>) => Promise<void>;
  updateStatus: (id: string, status: RequestEntry['status']) => Promise<void>;
  updateRequest: (id: string, data: Partial<RequestEntry>) => Promise<void>; // ✅ НОВОЕ
  deleteRequest: (id: string) => Promise<void>;
  
  // Действия для сотрудников
  fetchEmployees: () => Promise<void>;
  addEmployee: (emp: Omit<Employee, 'id'>) => Promise<void>;
  updateEmployee: (id: string, data: Partial<Employee>) => Promise<void>;
  removeEmployee: (id: string) => Promise<void>;
}

export const useBauflexStore = create<BauflexStore>()(
  persist(
    (set, get) => ({
      requests: [],
      employees: [],
      isLoading: false,
      lastFetch: 0,

      // Загрузка заявок
      fetchRequests: async () => {
        set({ isLoading: true });
        try {
          const response = await $api.get('/requests');
          set({ 
            requests: response.data,
            lastFetch: Date.now()
          });
          console.log('✅ Заявки загружены:', response.data.length);
        } catch (e) {
          console.error('❌ Ошибка загрузки заявок:', e);
        } finally {
          set({ isLoading: false });
        }
      },

      // Загрузка сотрудников
      fetchEmployees: async () => {
        try {
          const response = await $api.get('/employees');
          set({ employees: response.data });
          console.log('✅ Сотрудники загружены:', response.data.length);
        } catch (e) {
          console.error('❌ Ошибка загрузки сотрудников:', e);
        }
      },

      // Создание заявки
      addRequest: async (data) => {
        set({ isLoading: true });
        try {
          const response = await $api.post('/requests', data);
          
          // Если создано несколько заявок (инструменты)
          if (response.data.requests) {
            await get().fetchRequests(); // Перезагружаем все
          } else {
            // Одна заявка (СИЗ)
            set((state) => ({
              requests: [response.data, ...state.requests]
            }));
          }
          
          console.log('✅ Заявка создана');
        } catch (e) {
          console.error('❌ Ошибка создания заявки:', e);
          throw e; 
        } finally {
          set({ isLoading: false });
        }
      },

      // Обновление статуса
      updateStatus: async (id, status) => {
        try {
          const response = await $api.patch(`/requests/${id}`, { status });
          set((state) => ({
            requests: state.requests.map((r) => 
              r.id === id ? { ...r, status: response.data.status } : r
            )
          }));
          console.log(`✅ Статус обновлен: ${id} → ${status}`);
        } catch (e) {
          console.error('❌ Ошибка обновления статуса:', e);
          throw e;
        }
      },

      // ✅ НОВОЕ: Полное обновление заявки
      updateRequest: async (id, data) => {
        try {
          console.log('📝 Обновление заявки:', { id, data });
          
          const response = await $api.put(`/requests/${id}`, data);
          
          set((state) => ({
            requests: state.requests.map((r) => 
              r.id === id ? response.data : r
            )
          }));
          
          console.log('✅ Заявка обновлена:', response.data);
        } catch (e) {
          console.error('❌ Ошибка обновления заявки:', e);
          throw e;
        }
      },

      // Удаление заявки
      deleteRequest: async (id) => {
        try {
          await $api.delete(`/requests/${id}`);
          set((state) => ({
            requests: state.requests.filter((r) => r.id !== id)
          }));
          console.log(`🗑️ Заявка удалена: ${id}`);
        } catch (e) {
          console.error('❌ Ошибка удаления:', e);
          throw e;
        }
      },

      // Сотрудники
      addEmployee: async (emp) => {
        try {
          const response = await $api.post('/employees', emp);
          set((state) => ({
            employees: [...state.employees, response.data]
          }));
        } catch (e) {
          console.error('❌ Ошибка добавления сотрудника:', e);
          throw e;
        }
      },

      updateEmployee: async (id, data) => {
        try {
          const response = await $api.patch(`/employees/${id}`, data);
          set((state) => ({
            employees: state.employees.map((e) => 
              e.id === id ? response.data : e
            )
          }));
        } catch (e) {
          console.error('❌ Ошибка обновления сотрудника:', e);
          throw e;
        }
      },

      removeEmployee: async (id) => {
        try {
          await $api.delete(`/employees/${id}`);
          set((state) => ({
            employees: state.employees.filter((e) => e.id !== id)
          }));
        } catch (e) {
          console.error('❌ Ошибка удаления сотрудника:', e);
          throw e;
        }
      }
    }),
    {
      name: 'bauflex-storage',
      partialize: (state) => ({
        employees: state.employees,
        lastFetch: state.lastFetch
      })
    }
  )
);
