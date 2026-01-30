import { QueryClient } from '@tanstack/react-query';

// Настраиваем клиент: данные не будут считаться устаревшими 1 минуту
// Это снижает нагрузку на сервер (меньше дублирующих запросов)
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // 1 минута
      retry: 1, // Если ошибка, пробуем еще 1 раз
      refetchOnWindowFocus: false, // Не обновлять при переключении вкладок (для форм важно)
    },
  },
});