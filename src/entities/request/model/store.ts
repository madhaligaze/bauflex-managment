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
  createdAt?: string; // Поле из БД
}

interface BauflexStore {
  requests: RequestEntry[];
  employees: Employee[];
  isLoading: boolean;
  
  // Действия для заявок
  fetchRequests: () => Promise<void>;
  addRequest: (request: Omit<RequestEntry, 'id' | 'date' | 'status'>) => Promise<void>;
  updateStatus: (id: string, status: RequestEntry['status']) => Promise<void>;
  deleteRequest: (id: string) => Promise<void>; // Добавлено
  
  // Действия для сотрудников
  fetchEmployees: () => Promise<void>;
  addEmployee: (emp: Omit<Employee, 'id'>) => Promise<void>;
  updateEmployee: (id: string, data: Partial<Employee>) => Promise<void>;
  removeEmployee: (id: string) => Promise<void>;
}

// --- Store ---
export const useBauflexStore = create<BauflexStore>()(
  persist(
    (set) => ({
      requests: [],
      employees: [],
      isLoading: false,

      // 1. Загрузка всех заявок (для Админки)
      fetchRequests: async () => {
        set({ isLoading: true });
        try {
          const response = await $api.get('/requests');
          set({ requests: response.data });
        } catch (e) {
          console.error('Ошибка при получении списка заявок с сервера:', e);
        } finally {
          set({ isLoading: false });
        }
      },

      // 2. Загрузка всех сотрудников (для выбора в формах и управления)
      fetchEmployees: async () => {
        try {
          const response = await $api.get('/employees');
          set({ employees: response.data });
        } catch (e) {
          console.error('Ошибка при получении списка сотрудников:', e);
        }
      },

      // 3. Создание новой заявки
      addRequest: async (data) => {
        set({ isLoading: true });
        try {
          const response = await $api.post('/requests', data);
          set((state) => ({
            requests: [response.data, ...state.requests]
          }));
        } catch (e) {
          console.error('Ошибка сохранения заявки на сервере:', e);
          throw e; 
        } finally {
          set({ isLoading: false });
        }
      },

      // 4. Обновление статуса
      updateStatus: async (id, status) => {
        try {
          const response = await $api.patch(`/requests/${id}`, { status });
          set((state) => ({
            requests: state.requests.map((r) => 
              r.id === id ? { ...r, status: response.data.status } : r
            )
          }));
        } catch (e) {
          console.error('Не удалось обновить статус на сервере:', e);
        }
      },

      // 5. Удаление заявки (НОВОЕ)
      deleteRequest: async (id) => {
        try {
          await $api.delete(`/requests/${id}`);
          set((state) => ({
            requests: state.requests.filter((r) => r.id !== id)
          }));
        } catch (e) {
          console.error('Ошибка при удалении заявки:', e);
          throw e;
        }
      },

      // 6. Регистрация сотрудника
      addEmployee: async (data) => {
        try {
          const response = await $api.post('/employees', data);
          set((state) => ({
            employees: [...state.employees, response.data]
          }));
        } catch (e) {
          console.error('Ошибка при регистрации сотрудника:', e);
        }
      },

      // 7. Обновление данных сотрудника
      updateEmployee: async (id, data) => {
        try {
          const response = await $api.patch(`/employees/${id}`, data);
          set((state) => ({
            employees: state.employees.map((e) => 
              e.id === id ? { ...e, ...response.data } : e
            )
          }));
        } catch (e) {
          console.error('Ошибка при обновлении данных сотрудника:', e);
        }
      },

      // 8. Удаление сотрудника
      removeEmployee: async (id) => {
        try {
          await $api.delete(`/employees/${id}`);
          set((state) => ({
            employees: state.employees.filter((e) => e.id !== id)
          }));
        } catch (e) {
          console.error('Ошибка при удалении сотрудника:', e);
        }
      }
    }),
    { 
      name: 'bauflex-pro-storage',
      // Оставляем в localStorage только сотрудников для быстрой подгрузки форм,
      // а заявки всегда будем тянуть свежие с сервера в админке.
      partialize: (state) => ({ employees: state.employees })
    }
  )
);
