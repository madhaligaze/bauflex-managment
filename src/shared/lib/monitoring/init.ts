// src/shared/lib/monitoring/init.ts

/**
 * 🚀 ИНИЦИАЛИЗАЦИЯ СИСТЕМЫ МОНИТОРИНГА
 * 
 * Этот файл должен быть импортирован в main.tsx
 * для автоматического запуска всей системы мониторинга
 */

import { diagnosticLogger, LogLevel, ErrorCategory } from './DiagnosticLogger';
import { apiMonitor } from './APIMonitor';
import { stateMonitor } from './StateMonitor';

/**
 * Инициализация системы мониторинга
 */
export function initializeMonitoring() {
  console.log(`
╔════════════════════════════════════════════════════════╗
║                                                        ║
║   🔍 BAUFLEX DIAGNOSTIC SYSTEM                        ║
║   Version: 1.0.0                                       ║
║   Status: INITIALIZING...                              ║
║                                                        ║
╚════════════════════════════════════════════════════════╝
  `);

  // Инициализация логгера (автоматически при создании инстанса)
  diagnosticLogger;
  
  // Инициализация API монитора (автоматически при создании инстанса)
  apiMonitor;
  
  // Инициализация State монитора (автоматически при создании инстанса)
  stateMonitor;

  // Логируем успешную инициализацию
  diagnosticLogger.log({
    level: LogLevel.INFO,
    category: ErrorCategory.LOGIC,
    message: 'Diagnostic system initialized successfully',
    details: {
      components: ['DiagnosticLogger', 'APIMonitor', 'StateMonitor'],
      version: '1.0.0',
      environment: import.meta.env.MODE
    },
    context: { type: 'system_init' },
    meta: {}
  });

  // Установка глобального доступа для отладки в консоли
  if (import.meta.env.DEV) {
    (window as any).__diagnostic__ = {
      logger: diagnosticLogger,
      api: apiMonitor,
      state: stateMonitor,
      
      // Удобные команды
      getLogs: () => diagnosticLogger.getEvents(),
      getApiStats: () => apiMonitor.getStatistics(),
      getStateViolations: () => stateMonitor.getViolations(),
      exportAll: () => {
        console.log('Diagnostic Logger:', diagnosticLogger.exportLogs());
        console.log('API Monitor:', apiMonitor.export());
        console.log('State Monitor:', stateMonitor.export());
      },
      clear: () => {
        diagnosticLogger.clearLogs();
        console.log('All diagnostic data cleared');
      }
    };

    console.log(`
╔════════════════════════════════════════════════════════╗
║  💡 DEVELOPER MODE                                     ║
║                                                        ║
║  Diagnostic tools available in console:                ║
║  • __diagnostic__.logger                               ║
║  • __diagnostic__.api                                  ║
║  • __diagnostic__.state                                ║
║                                                        ║
║  Quick commands:                                       ║
║  • __diagnostic__.getLogs()                            ║
║  • __diagnostic__.getApiStats()                        ║
║  • __diagnostic__.getStateViolations()                 ║
║  • __diagnostic__.exportAll()                          ║
║  • __diagnostic__.clear()                              ║
║                                                        ║
║  Open Dashboard: Ctrl + Shift + D                      ║
╚════════════════════════════════════════════════════════╝
    `);
  }

  console.log(`
╔════════════════════════════════════════════════════════╗
║                                                        ║
║   ✅ DIAGNOSTIC SYSTEM READY                          ║
║   Monitoring: ON                                       ║
║   API Tracking: ON                                     ║
║   State Validation: ON                                 ║
║                                                        ║
╚════════════════════════════════════════════════════════╝
  `);
}

/**
 * Хелпер для интеграции с Zustand store
 */
export function createMonitoredStore<T>(
  storeName: string,
  createStore: any
) {
  return (...args: any[]) => {
    const store = createStore(...args);
    
    // Перехватываем setState
    const originalSetState = store.setState;
    store.setState = (partial: any, replace?: boolean, actionName?: string) => {
      const prevState = store.getState();
      const result = originalSetState(partial, replace);
      const newState = store.getState();
      
      // Создаём снимок
      stateMonitor.snapshot(storeName, newState, actionName);
      
      // Проверяем переход
      if (prevState) {
        stateMonitor.validateTransition(storeName, prevState, newState, actionName || 'setState');
      }
      
      return result;
    };
    
    return store;
  };
}

/**
 * React Hook для использования диагностики в компонентах
 */
export function useDiagnostics() {
  return {
    log: (level: LogLevel, category: ErrorCategory, message: string, details?: any) => {
      diagnosticLogger.log({
        level,
        category,
        message,
        details,
        context: { type: 'component' },
        meta: {}
      });
    },
    
    trackAction: (actionName: string, details?: any) => {
      diagnosticLogger.log({
        level: LogLevel.INFO,
        category: ErrorCategory.UI,
        message: `User action: ${actionName}`,
        details,
        context: { type: 'user_action' },
        meta: {}
      });
    },
    
    trackError: (error: Error, component?: string) => {
      diagnosticLogger.log({
        level: LogLevel.ERROR,
        category: ErrorCategory.UI,
        message: `Component error: ${error.message}`,
        details: { component, error: error.toString() },
        stackTrace: error.stack,
        context: { type: 'component_error' },
        meta: {}
      });
    },
    
    getStats: () => diagnosticLogger.getStatistics()
  };
}

/**
 * React Error Boundary HOC с интеграцией диагностики
 */
import { Component, ReactNode, ErrorInfo } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  componentName?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class MonitoredErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    diagnosticLogger.log({
      level: LogLevel.CRITICAL,
      category: ErrorCategory.UI,
      message: `React Error Boundary caught error in ${this.props.componentName || 'Unknown Component'}`,
      details: {
        error: error.toString(),
        errorInfo: errorInfo.componentStack,
        componentName: this.props.componentName
      },
      stackTrace: error.stack,
      context: { type: 'error_boundary' },
      meta: {}
    });
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-900 to-red-950 p-8">
          <div className="bg-white/10 backdrop-blur-xl border border-red-500/30 rounded-3xl p-8 max-w-md">
            <div className="text-red-400 text-6xl mb-4">💥</div>
            <h1 className="text-white text-2xl font-bold mb-2">Что-то пошло не так</h1>
            <p className="text-white/70 mb-4">
              Компонент {this.props.componentName || 'приложения'} столкнулся с ошибкой.
            </p>
            <details className="text-white/50 text-sm">
              <summary className="cursor-pointer mb-2">Технические детали</summary>
              <pre className="bg-black/30 p-2 rounded overflow-auto max-h-40">
                {this.state.error?.toString()}
              </pre>
            </details>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl transition-colors"
            >
              Перезагрузить страницу
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
