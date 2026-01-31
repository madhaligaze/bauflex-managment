// src/widgets/diagnostic/DiagnosticDashboard.tsx

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Activity, AlertTriangle, Database, Cpu, HardDrive, 
  RefreshCw, Download, Trash2, TrendingUp, TrendingDown,
  CheckCircle, XCircle, Clock, Zap
} from 'lucide-react';
import { Card } from '@/shared/ui/Card';
import { Button } from '@/shared/ui/Button';
import { diagnosticLogger } from '@/shared/lib/monitoring/DiagnosticLogger';
import { apiMonitor } from '@/shared/lib/monitoring/APIMonitor';
import { stateMonitor } from '@/shared/lib/monitoring/StateMonitor';

/**
 * 📊 DIAGNOSTIC DASHBOARD
 * 
 * Визуальная панель для мониторинга состояния приложения
 */

export const DiagnosticDashboard = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'logs' | 'api' | 'state' | 'database'>('overview');
  const [stats, setStats] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [apiCalls, setApiCalls] = useState<any[]>([]);
  const [stateViolations, setStateViolations] = useState<any[]>([]);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Обновление данных
  useEffect(() => {
    if (isOpen) {
      updateData();
      
      if (autoRefresh) {
        const interval = setInterval(updateData, 5000); // Каждые 5 секунд
        return () => clearInterval(interval);
      }
    }
  }, [isOpen, autoRefresh]);

  const updateData = () => {
    setStats(diagnosticLogger.getStatistics());
    setLogs(diagnosticLogger.getEvents({ limit: 50 }));
    setApiCalls(apiMonitor.getCalls({ limit: 20 }));
    setStateViolations(stateMonitor.getViolations());
  };

  // Горячие клавиши для открытия (Ctrl + Shift + D)
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-50 bg-purple-600 hover:bg-purple-500 shadow-2xl"
        title="Open Diagnostic Dashboard (Ctrl+Shift+D)"
      >
        <Activity className="mr-2" size={18} />
        Диагностика
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-xl">
      <div className="h-full flex flex-col p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-black text-white flex items-center gap-3">
              <Activity className="text-purple-500" size={32} />
              Diagnostic Dashboard
            </h1>
            <p className="text-white/60 text-sm mt-1">
              Система мониторинга и диагностики • Session: {stats?.sessionId?.slice(-8)}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={autoRefresh ? 'text-green-400' : 'text-gray-400'}
            >
              <RefreshCw size={16} className={autoRefresh ? 'animate-spin' : ''} />
              Auto
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={updateData}
            >
              <RefreshCw size={16} />
              Обновить
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                const data = diagnosticLogger.exportLogs();
                const blob = new Blob([data], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `diagnostic-${Date.now()}.json`;
                a.click();
              }}
            >
              <Download size={16} />
              Экспорт
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (confirm('Очистить все логи?')) {
                  diagnosticLogger.clearLogs();
                  updateData();
                }
              }}
            >
              <Trash2 size={16} />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
            >
              ✕ Закрыть
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          {[
            { id: 'overview', label: 'Обзор', icon: Activity },
            { id: 'logs', label: 'Логи', icon: AlertTriangle },
            { id: 'api', label: 'API', icon: Zap },
            { id: 'state', label: 'State', icon: Database },
            { id: 'database', label: 'БД', icon: HardDrive },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`
                px-4 py-2 rounded-xl font-semibold transition-all flex items-center gap-2
                ${activeTab === tab.id
                  ? 'bg-purple-600 text-white'
                  : 'bg-white/10 text-white/60 hover:bg-white/20'
                }
              `}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          {activeTab === 'overview' && <OverviewTab stats={stats} />}
          {activeTab === 'logs' && <LogsTab logs={logs} />}
          {activeTab === 'api' && <APITab calls={apiCalls} />}
          {activeTab === 'state' && <StateTab violations={stateViolations} />}
          {activeTab === 'database' && <DatabaseTab />}
        </div>
      </div>
    </div>
  );
};

// ===== OVERVIEW TAB =====
const OverviewTab = ({ stats }: { stats: any }) => {
  if (!stats) return <div className="text-white">Загрузка...</div>;

  const errorRate = stats.errorRate || 0;
  const healthStatus = errorRate < 5 ? 'healthy' : errorRate < 15 ? 'warning' : 'critical';
  
  return (
    <div className="grid grid-cols-3 gap-4">
      {/* System Health */}
      <Card className="bg-gradient-to-br from-green-500/20 to-green-600/20 border-green-500/30 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-bold text-lg">System Health</h3>
          {healthStatus === 'healthy' ? (
            <CheckCircle className="text-green-400" size={32} />
          ) : healthStatus === 'warning' ? (
            <AlertTriangle className="text-yellow-400" size={32} />
          ) : (
            <XCircle className="text-red-400" size={32} />
          )}
        </div>
        <div className="text-4xl font-black text-white mb-2">
          {healthStatus === 'healthy' ? 'Отлично' : healthStatus === 'warning' ? 'Внимание' : 'Критично'}
        </div>
        <div className="text-white/60 text-sm">
          Error Rate: {errorRate.toFixed(1)}%
        </div>
      </Card>

      {/* Total Events */}
      <Card className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 border-blue-500/30 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-bold text-lg">Total Events</h3>
          <Activity className="text-blue-400" size={32} />
        </div>
        <div className="text-4xl font-black text-white mb-2">
          {stats.totalEvents}
        </div>
        <div className="text-white/60 text-sm">
          События за сессию
        </div>
      </Card>

      {/* Memory Usage */}
      <Card className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 border-purple-500/30 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-bold text-lg">Memory</h3>
          <Cpu className="text-purple-400" size={32} />
        </div>
        <div className="text-4xl font-black text-white mb-2">
          {stats.memoryUsage.toFixed(1)} MB
        </div>
        <div className="text-white/60 text-sm">
          Используется памяти
        </div>
      </Card>

      {/* Error Breakdown */}
      <Card className="col-span-3 bg-white/5 border-white/10 p-6">
        <h3 className="text-white font-bold text-lg mb-4">Breakdown by Level</h3>
        <div className="grid grid-cols-6 gap-4">
          {Object.entries(stats.errorCounts).map(([level, count]: [string, any]) => (
            <div key={level} className="text-center">
              <div className={`text-3xl font-black mb-1 ${
                level === 'FATAL' ? 'text-red-500' :
                level === 'CRITICAL' ? 'text-orange-500' :
                level === 'ERROR' ? 'text-red-400' :
                level === 'WARN' ? 'text-yellow-400' :
                level === 'INFO' ? 'text-blue-400' :
                'text-gray-400'
              }`}>
                {count}
              </div>
              <div className="text-white/60 text-xs">{level}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* Network Status */}
      <Card className="bg-white/5 border-white/10 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-bold text-lg">Network</h3>
          {stats.isOnline ? (
            <CheckCircle className="text-green-400" size={24} />
          ) : (
            <XCircle className="text-red-400" size={24} />
          )}
        </div>
        <div className="text-2xl font-black text-white">
          {stats.isOnline ? 'Online' : 'Offline'}
        </div>
      </Card>
    </div>
  );
};

// ===== LOGS TAB =====
const LogsTab = ({ logs }: { logs: any[] }) => {
  const getLevelColor = (level: string) => {
    switch (level) {
      case 'FATAL': return 'bg-red-600 text-white';
      case 'CRITICAL': return 'bg-orange-600 text-white';
      case 'ERROR': return 'bg-red-500 text-white';
      case 'WARN': return 'bg-yellow-500 text-black';
      case 'INFO': return 'bg-blue-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  return (
    <div className="space-y-2">
      {logs.length === 0 ? (
        <div className="text-white/60 text-center py-8">Нет логов</div>
      ) : (
        logs.map(log => (
          <motion.div
            key={log.id}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-colors"
          >
            <div className="flex items-start gap-3">
              <span className={`px-2 py-1 rounded-lg text-xs font-bold ${getLevelColor(log.level)}`}>
                {log.level}
              </span>
              <span className="px-2 py-1 rounded-lg text-xs font-bold bg-purple-500/20 text-purple-300">
                {log.category}
              </span>
              <div className="flex-1">
                <div className="text-white font-semibold mb-1">{log.message}</div>
                <div className="text-white/40 text-xs">
                  {new Date(log.timestamp).toLocaleString()}
                </div>
                {log.details && (
                  <details className="mt-2">
                    <summary className="text-white/60 text-sm cursor-pointer">Details</summary>
                    <pre className="text-white/60 text-xs mt-2 p-2 bg-black/30 rounded overflow-auto max-h-40">
                      {JSON.stringify(log.details, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            </div>
          </motion.div>
        ))
      )}
    </div>
  );
};

// ===== API TAB =====
const APITab = ({ calls }: { calls: any[] }) => {
  const stats = apiMonitor.getStatistics();

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-4">
        <Card className="bg-white/5 border-white/10 p-4">
          <div className="text-white/60 text-sm mb-1">Total Calls</div>
          <div className="text-2xl font-black text-white">{stats.totalCalls}</div>
        </Card>
        <Card className="bg-white/5 border-white/10 p-4">
          <div className="text-white/60 text-sm mb-1">Success Rate</div>
          <div className="text-2xl font-black text-green-400">{stats.successRate}</div>
        </Card>
        <Card className="bg-white/5 border-white/10 p-4">
          <div className="text-white/60 text-sm mb-1">Avg Duration</div>
          <div className="text-2xl font-black text-blue-400">{stats.averageDuration}</div>
        </Card>
        <Card className="bg-white/5 border-white/10 p-4">
          <div className="text-white/60 text-sm mb-1">Slow Calls</div>
          <div className="text-2xl font-black text-orange-400">{stats.slowCalls}</div>
        </Card>
      </div>

      <div className="space-y-2">
        {calls.map((call, idx) => (
          <div
            key={idx}
            className="bg-white/5 border border-white/10 rounded-xl p-4"
          >
            <div className="flex items-center gap-3">
              <span className={`px-2 py-1 rounded text-xs font-bold ${
                call.success ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'
              }`}>
                {call.status}
              </span>
              <span className="px-2 py-1 rounded text-xs font-bold bg-blue-500/20 text-blue-300">
                {call.method}
              </span>
              <span className="text-white text-sm flex-1 font-mono truncate">{call.url}</span>
              <span className={`text-sm font-semibold ${
                call.duration > 3000 ? 'text-red-400' :
                call.duration > 1000 ? 'text-yellow-400' :
                'text-green-400'
              }`}>
                {call.duration.toFixed(0)}ms
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ===== STATE TAB =====
const StateTab = ({ violations }: { violations: any[] }) => {
  return (
    <div className="space-y-2">
      {violations.length === 0 ? (
        <div className="text-center py-8">
          <CheckCircle className="text-green-400 mx-auto mb-2" size={48} />
          <div className="text-white font-semibold">Нет нарушений!</div>
          <div className="text-white/60 text-sm">State выглядит здоровым</div>
        </div>
      ) : (
        violations.map((v, idx) => (
          <div key={idx} className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="text-red-400 flex-shrink-0" size={24} />
              <div className="flex-1">
                <div className="text-red-300 font-bold mb-1">{v.type}</div>
                <div className="text-white mb-2">{v.message}</div>
                <details>
                  <summary className="text-white/60 text-sm cursor-pointer">Details</summary>
                  <pre className="text-white/60 text-xs mt-2 p-2 bg-black/30 rounded overflow-auto max-h-40">
                    {JSON.stringify(v.details, null, 2)}
                  </pre>
                </details>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

// ===== DATABASE TAB =====
const DatabaseTab = () => {
  const [dbStats, setDbStats] = useState<any>(null);
  const [dbHealth, setDbHealth] = useState<any>(null);

  useEffect(() => {
    // Fetch database stats from backend
    fetch('/api/diagnostic/database/stats')
      .then(res => res.json())
      .then(setDbStats)
      .catch(console.error);

    fetch('/api/diagnostic/health')
      .then(res => res.json())
      .then(data => setDbHealth(data.database))
      .catch(console.error);
  }, []);

  if (!dbStats || !dbHealth) {
    return <div className="text-white">Загрузка данных БД...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-white/5 border-white/10 p-4">
          <div className="text-white/60 text-sm mb-1">Total Queries</div>
          <div className="text-2xl font-black text-white">{dbStats.totalQueries}</div>
        </Card>
        <Card className="bg-white/5 border-white/10 p-4">
          <div className="text-white/60 text-sm mb-1">Avg Duration</div>
          <div className="text-2xl font-black text-blue-400">{dbStats.averageDuration}</div>
        </Card>
        <Card className="bg-white/5 border-white/10 p-4">
          <div className="text-white/60 text-sm mb-1">Slow Queries</div>
          <div className="text-2xl font-black text-orange-400">{dbStats.slowQueries}</div>
        </Card>
      </div>

      <Card className="bg-white/5 border-white/10 p-4">
        <h3 className="text-white font-bold mb-2">Database Health</h3>
        <div className="flex items-center gap-4">
          <div className={`w-4 h-4 rounded-full ${
            dbHealth.connected ? 'bg-green-500' : 'bg-red-500'
          }`} />
          <span className="text-white">
            {dbHealth.connected ? 'Connected' : 'Disconnected'}
          </span>
          <span className="text-white/60">
            Response time: {dbHealth.responseTime}ms
          </span>
        </div>
      </Card>

      <Card className="bg-white/5 border-white/10 p-4">
        <h3 className="text-white font-bold mb-2">Queries by Model</h3>
        <div className="space-y-2">
          {Object.entries(dbStats.queryCountByModel).map(([model, count]: [string, any]) => (
            <div key={model} className="flex items-center justify-between">
              <span className="text-white">{model}</span>
              <span className="text-white/60">{count} queries</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
