/**
 * Форматирование ISO даты в читаемый формат
 * Из: "2026-01-31T11:58:49.220Z"
 * В: "31.01.2026 14:58"
 */
export const formatDate = (isoDate: string): string => {
  try {
    const date = new Date(isoDate);
    
    // Проверка на валидность
    if (isNaN(date.getTime())) {
      return '—';
    }
    
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${day}.${month}.${year} ${hours}:${minutes}`;
  } catch {
    return '—';
  }
};

/**
 * Форматирование только даты (без времени)
 * В: "31.01.2026"
 */
export const formatDateOnly = (isoDate: string): string => {
  try {
    const date = new Date(isoDate);
    
    if (isNaN(date.getTime())) {
      return '—';
    }
    
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    
    return `${day}.${month}.${year}`;
  } catch {
    return '—';
  }
};

/**
 * Относительное время ("2 часа назад", "вчера", "3 дня назад")
 */
export const formatRelativeTime = (isoDate: string): string => {
  try {
    const date = new Date(isoDate);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'только что';
    if (diffMins < 60) return `${diffMins} мин. назад`;
    if (diffHours < 24) return `${diffHours} ч. назад`;
    if (diffDays === 1) return 'вчера';
    if (diffDays < 7) return `${diffDays} дн. назад`;
    
    return formatDateOnly(isoDate);
  } catch {
    return '—';
  }
};
