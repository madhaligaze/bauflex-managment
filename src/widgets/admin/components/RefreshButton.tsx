import { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/shared/ui/Button';

interface RefreshButtonProps {
  onRefresh: () => Promise<void>;
  lastUpdated?: number;
}

export const RefreshButton = ({ onRefresh, lastUpdated }: RefreshButtonProps) => {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await onRefresh();
    } catch (error) {
      console.error('Ошибка обновления:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const getTimeAgo = () => {
    if (!lastUpdated) return '';
    const seconds = Math.floor((Date.now() - lastUpdated) / 1000);
    if (seconds < 60) return `${seconds} сек назад`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} мин назад`;
    const hours = Math.floor(minutes / 60);
    return `${hours} ч назад`;
  };

  return (
    <div className="flex items-center gap-3">
      {lastUpdated && (
        <span className="text-xs text-white/40">
          {getTimeAgo()}
        </span>
      )}
      <Button
        onClick={handleRefresh}
        disabled={isRefreshing}
        variant="secondary"
        size="sm"
        className="bg-white/5 border-white/10 hover:bg-white/10 transition-all"
      >
        <RefreshCw 
          size={16} 
          className={`mr-2 ${isRefreshing ? 'animate-spin' : ''}`}
        />
        Обновить
      </Button>
    </div>
  );
};
