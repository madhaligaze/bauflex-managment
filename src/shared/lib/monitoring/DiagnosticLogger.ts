// src/shared/lib/monitoring/DiagnosticLogger.ts

/**
 * 🔍 УНИВЕРСАЛЬНАЯ СИСТЕМА ДИАГНОСТИКИ И МОНИТОРИНГА
 * 
 * Этот модуль отлавливает ВСЁ:
 * - Ошибки UI/UX
 * - Проблемы с API
 * - Проблемы с базой данных
 * - Логические противоречия
 * - Performance issues
 * - Memory leaks
 * - Network errors
 * - State inconsistencies
 * 
 * Версия: 1.0
 * Автор: Bauflex Team
 * Дата: 2026-02-01
 */

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  CRITICAL = 'CRITICAL',
  FATAL = 'FATAL'
}

export enum ErrorCategory {
  UI = 'UI',
  API = 'API',
  DATABASE = 'DATABASE',
  LOGIC = 'LOGIC',
  PERFORMANCE = 'PERFORMANCE',
  MEMORY = 'MEMORY',
  NETWORK = 'NETWORK',
  STATE = 'STATE',
  SECURITY = 'SECURITY',
  VALIDATION = 'VALIDATION'
}

export interface DiagnosticEvent {
  id: string;
  timestamp: string;
  level: LogLevel;
  category: ErrorCategory;
  message: string;
  details?: any;
  stackTrace?: string;
  userAgent?: string;
  url?: string;
  userId?: string;
  sessionId?: string;
  context?: Record<string, any>;
  // Метаданные для анализа
  meta: {
    component?: string;
    action?: string;
    duration?: number;
    memoryUsage?: number;
    networkLatency?: number;
  };
}

export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'critical';
  checks: {
    api: boolean;
    database: boolean;
    memory: boolean;
    network: boolean;
  };
  metrics: {
    errorRate: number;
    averageResponseTime: number;
    memoryUsage: number;
    activeUsers: number;
  };
  timestamp: string;
}

/**
 * Главный класс диагностической системы
 */
export class DiagnosticLogger {
  private static instance: DiagnosticLogger;
  private events: DiagnosticEvent[] = [];
  private maxEvents = 1000; // Максимум событий в памяти
  private sessionId: string;
  private isProduction: boolean;
  private errorThresholds = {
    [LogLevel.WARN]: 10,
    [LogLevel.ERROR]: 5,
    [LogLevel.CRITICAL]: 2,
    [LogLevel.FATAL]: 1
  };

  // Счётчики для анализа
  private errorCounts: Record<LogLevel, number> = {
    [LogLevel.DEBUG]: 0,
    [LogLevel.INFO]: 0,
    [LogLevel.WARN]: 0,
    [LogLevel.ERROR]: 0,
    [LogLevel.CRITICAL]: 0,
    [LogLevel.FATAL]: 0
  };

  private constructor() {
    this.sessionId = this.generateSessionId();
    this.isProduction = import.meta.env.PROD;
    this.initializeMonitoring();
  }

  public static getInstance(): DiagnosticLogger {
    if (!DiagnosticLogger.instance) {
      DiagnosticLogger.instance = new DiagnosticLogger();
    }
    return DiagnosticLogger.instance;
  }

  /**
   * Инициализация системы мониторинга
   */
  private initializeMonitoring() {
    // Перехват глобальных ошибок
    this.setupGlobalErrorHandlers();
    
    // Мониторинг производительности
    this.setupPerformanceMonitoring();
    
    // Мониторинг памяти
    this.setupMemoryMonitoring();
    
    // Мониторинг сети
    this.setupNetworkMonitoring();
    
    // Периодическая проверка здоровья системы
    this.startHealthChecks();

    console.log(`
╔════════════════════════════════════════════════════════╗
║  🔍 DIAGNOSTIC SYSTEM INITIALIZED                      ║
║  Session ID: ${this.sessionId}                         ║
║  Environment: ${this.isProduction ? 'PRODUCTION' : 'DEVELOPMENT'}                               ║
║  Status: ✅ ONLINE                                     ║
╚════════════════════════════════════════════════════════╝
    `);
  }

  /**
   * Генерация уникального ID сессии
   */
  private generateSessionId(): string {
    return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Настройка глобальных обработчиков ошибок
   */
  private setupGlobalErrorHandlers() {
    // JavaScript ошибки
    window.addEventListener('error', (event) => {
      this.log({
        level: LogLevel.ERROR,
        category: ErrorCategory.UI,
        message: `Uncaught Error: ${event.message}`,
        details: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          error: event.error
        },
        stackTrace: event.error?.stack,
        context: { type: 'global_error' }
      });
    });

    // Promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.log({
        level: LogLevel.ERROR,
        category: ErrorCategory.LOGIC,
        message: `Unhandled Promise Rejection: ${event.reason}`,
        details: { reason: event.reason },
        stackTrace: event.reason?.stack,
        context: { type: 'promise_rejection' }
      });
    });

    // Console errors (перехват)
    const originalError = console.error;
    console.error = (...args) => {
      this.log({
        level: LogLevel.ERROR,
        category: ErrorCategory.LOGIC,
        message: 'Console Error',
        details: { args },
        context: { type: 'console_error' }
      });
      originalError.apply(console, args);
    };

    // Console warnings (перехват)
    const originalWarn = console.warn;
    console.warn = (...args) => {
      this.log({
        level: LogLevel.WARN,
        category: ErrorCategory.LOGIC,
        message: 'Console Warning',
        details: { args },
        context: { type: 'console_warn' }
      });
      originalWarn.apply(console, args);
    };
  }

  /**
   * Мониторинг производительности
   */
  private setupPerformanceMonitoring() {
    // Navigation Timing
    if (window.performance && window.performance.timing) {
      window.addEventListener('load', () => {
        setTimeout(() => {
          const timing = window.performance.timing;
          const pageLoadTime = timing.loadEventEnd - timing.navigationStart;
          const domReadyTime = timing.domContentLoadedEventEnd - timing.navigationStart;
          const ttfb = timing.responseStart - timing.navigationStart;

          if (pageLoadTime > 3000) {
            this.log({
              level: LogLevel.WARN,
              category: ErrorCategory.PERFORMANCE,
              message: 'Slow page load detected',
              details: {
                pageLoadTime,
                domReadyTime,
                ttfb,
                threshold: 3000
              },
              context: { type: 'performance_timing' }
            });
          }

          this.log({
            level: LogLevel.INFO,
            category: ErrorCategory.PERFORMANCE,
            message: 'Page load metrics',
            details: { pageLoadTime, domReadyTime, ttfb },
            context: { type: 'performance_metrics' }
          });
        }, 0);
      });
    }

    // Long Tasks API
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.duration > 50) {
              this.log({
                level: LogLevel.WARN,
                category: ErrorCategory.PERFORMANCE,
                message: 'Long task detected',
                details: {
                  duration: entry.duration,
                  startTime: entry.startTime,
                  name: entry.name
                },
                context: { type: 'long_task' }
              });
            }
          }
        });
        observer.observe({ entryTypes: ['longtask'] });
      } catch (e) {
        // Long tasks not supported
      }
    }
  }

  /**
   * Мониторинг памяти
   */
  private setupMemoryMonitoring() {
    // @ts-ignore - performance.memory может быть недоступно
    if (performance.memory) {
      setInterval(() => {
        // @ts-ignore
        const memory = performance.memory;
        const usedMemoryMB = memory.usedJSHeapSize / 1048576;
        const totalMemoryMB = memory.totalJSHeapSize / 1048576;
        const limitMemoryMB = memory.jsHeapSizeLimit / 1048576;
        const usagePercent = (usedMemoryMB / limitMemoryMB) * 100;

        if (usagePercent > 80) {
          this.log({
            level: LogLevel.CRITICAL,
            category: ErrorCategory.MEMORY,
            message: 'High memory usage detected',
            details: {
              usedMemoryMB: usedMemoryMB.toFixed(2),
              totalMemoryMB: totalMemoryMB.toFixed(2),
              limitMemoryMB: limitMemoryMB.toFixed(2),
              usagePercent: usagePercent.toFixed(2)
            },
            context: { type: 'memory_warning' }
          });
        }
      }, 30000); // Проверка каждые 30 секунд
    }
  }

  /**
   * Мониторинг сети
   */
  private setupNetworkMonitoring() {
    // Online/Offline события
    window.addEventListener('online', () => {
      this.log({
        level: LogLevel.INFO,
        category: ErrorCategory.NETWORK,
        message: 'Network connection restored',
        context: { type: 'network_online' }
      });
    });

    window.addEventListener('offline', () => {
      this.log({
        level: LogLevel.ERROR,
        category: ErrorCategory.NETWORK,
        message: 'Network connection lost',
        context: { type: 'network_offline' }
      });
    });

    // Network Information API
    // @ts-ignore
    if (navigator.connection) {
      // @ts-ignore
      const connection = navigator.connection;
      
      const checkConnection = () => {
        if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
          this.log({
            level: LogLevel.WARN,
            category: ErrorCategory.NETWORK,
            message: 'Slow network detected',
            details: {
              effectiveType: connection.effectiveType,
              downlink: connection.downlink,
              rtt: connection.rtt
            },
            context: { type: 'slow_network' }
          });
        }
      };

      connection.addEventListener('change', checkConnection);
      checkConnection();
    }
  }

  /**
   * Периодические проверки здоровья системы
   */
  private startHealthChecks() {
    setInterval(() => {
      this.performHealthCheck();
    }, 60000); // Каждую минуту
  }

  /**
   * Проверка здоровья системы
   */
  private async performHealthCheck(): Promise<SystemHealth> {
    const health: SystemHealth = {
      status: 'healthy',
      checks: {
        api: true,
        database: true,
        memory: true,
        network: navigator.onLine
      },
      metrics: {
        errorRate: this.calculateErrorRate(),
        averageResponseTime: 0,
        memoryUsage: 0,
        activeUsers: 1
      },
      timestamp: new Date().toISOString()
    };

    // Проверка памяти
    // @ts-ignore
    if (performance.memory) {
      // @ts-ignore
      const memory = performance.memory;
      health.metrics.memoryUsage = memory.usedJSHeapSize / 1048576;
      health.checks.memory = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) < 0.9;
    }

    // Общий статус
    const checksArray = Object.values(health.checks);
    if (checksArray.every(check => check)) {
      health.status = 'healthy';
    } else if (checksArray.some(check => check)) {
      health.status = 'degraded';
    } else {
      health.status = 'critical';
    }

    if (health.status !== 'healthy') {
      this.log({
        level: health.status === 'critical' ? LogLevel.CRITICAL : LogLevel.WARN,
        category: ErrorCategory.LOGIC,
        message: `System health check: ${health.status}`,
        details: health,
        context: { type: 'health_check' }
      });
    }

    return health;
  }

  /**
   * Вычисление процента ошибок
   */
  private calculateErrorRate(): number {
    const totalErrors = this.errorCounts[LogLevel.ERROR] + 
                       this.errorCounts[LogLevel.CRITICAL] + 
                       this.errorCounts[LogLevel.FATAL];
    const totalEvents = Object.values(this.errorCounts).reduce((a, b) => a + b, 0);
    return totalEvents > 0 ? (totalErrors / totalEvents) * 100 : 0;
  }

  /**
   * Основной метод логирования
   */
  public log(params: Omit<DiagnosticEvent, 'id' | 'timestamp' | 'userAgent' | 'url' | 'sessionId'>): void {
    const event: DiagnosticEvent = {
      id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      sessionId: this.sessionId,
      ...params,
      meta: {
        ...params.meta,
        memoryUsage: this.getMemoryUsage()
      }
    };

    // Добавление события в массив
    this.events.push(event);
    
    // Ограничение размера массива
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents);
    }

    // Увеличение счётчика
    this.errorCounts[params.level]++;

    // Вывод в консоль
    this.consoleLog(event);

    // Отправка критических событий на сервер
    if (params.level === LogLevel.CRITICAL || params.level === LogLevel.FATAL) {
      this.sendToServer(event);
    }

    // Проверка порогов
    this.checkThresholds(event);

    // Сохранение в localStorage (если не production)
    if (!this.isProduction) {
      this.saveToLocalStorage(event);
    }
  }

  /**
   * Получение использования памяти
   */
  private getMemoryUsage(): number {
    // @ts-ignore
    if (performance.memory) {
      // @ts-ignore
      return performance.memory.usedJSHeapSize / 1048576;
    }
    return 0;
  }

  /**
   * Красивый вывод в консоль
   */
  private consoleLog(event: DiagnosticEvent): void {
    const emoji = {
      [LogLevel.DEBUG]: '🐛',
      [LogLevel.INFO]: 'ℹ️',
      [LogLevel.WARN]: '⚠️',
      [LogLevel.ERROR]: '❌',
      [LogLevel.CRITICAL]: '🔥',
      [LogLevel.FATAL]: '💀'
    };

    const color = {
      [LogLevel.DEBUG]: 'color: gray',
      [LogLevel.INFO]: 'color: blue',
      [LogLevel.WARN]: 'color: orange',
      [LogLevel.ERROR]: 'color: red',
      [LogLevel.CRITICAL]: 'color: red; font-weight: bold',
      [LogLevel.FATAL]: 'color: red; font-weight: bold; font-size: 14px'
    };

    console.log(
      `%c${emoji[event.level]} [${event.level}] [${event.category}] ${event.message}`,
      color[event.level]
    );

    if (event.details) {
      console.log('📋 Details:', event.details);
    }

    if (event.stackTrace) {
      console.log('📚 Stack:', event.stackTrace);
    }

    if (event.context) {
      console.log('🔍 Context:', event.context);
    }
  }

  /**
   * Отправка события на сервер
   */
  private async sendToServer(event: DiagnosticEvent): Promise<void> {
    try {
      await fetch('/api/diagnostic/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event)
      });
    } catch (error) {
      console.error('Failed to send diagnostic event to server:', error);
    }
  }

  /**
   * Проверка порогов срабатывания
   */
  private checkThresholds(event: DiagnosticEvent): void {
    const threshold = this.errorThresholds[event.level];
    if (threshold && this.errorCounts[event.level] >= threshold) {
      console.error(`
╔════════════════════════════════════════════════════════╗
║  ⚠️  THRESHOLD EXCEEDED                                 ║
║  Level: ${event.level}                                  ║
║  Count: ${this.errorCounts[event.level]}/${threshold}    ║
║  Category: ${event.category}                           ║
║  Message: ${event.message}                             ║
╚════════════════════════════════════════════════════════╝
      `);
    }
  }

  /**
   * Сохранение в localStorage
   */
  private saveToLocalStorage(event: DiagnosticEvent): void {
    try {
      const key = `diagnostic_${event.id}`;
      localStorage.setItem(key, JSON.stringify(event));
      
      // Очистка старых записей (оставляем только последние 100)
      const keys = Object.keys(localStorage).filter(k => k.startsWith('diagnostic_'));
      if (keys.length > 100) {
        keys.slice(0, keys.length - 100).forEach(k => localStorage.removeItem(k));
      }
    } catch (e) {
      // localStorage full or disabled
    }
  }

  /**
   * Получение всех событий
   */
  public getEvents(filter?: {
    level?: LogLevel;
    category?: ErrorCategory;
    limit?: number;
  }): DiagnosticEvent[] {
    let filtered = [...this.events];

    if (filter?.level) {
      filtered = filtered.filter(e => e.level === filter.level);
    }

    if (filter?.category) {
      filtered = filtered.filter(e => e.category === filter.category);
    }

    if (filter?.limit) {
      filtered = filtered.slice(-filter.limit);
    }

    return filtered;
  }

  /**
   * Экспорт логов
   */
  public exportLogs(): string {
    return JSON.stringify({
      sessionId: this.sessionId,
      timestamp: new Date().toISOString(),
      events: this.events,
      summary: {
        total: this.events.length,
        counts: this.errorCounts
      }
    }, null, 2);
  }

  /**
   * Очистка логов
   */
  public clearLogs(): void {
    this.events = [];
    this.errorCounts = {
      [LogLevel.DEBUG]: 0,
      [LogLevel.INFO]: 0,
      [LogLevel.WARN]: 0,
      [LogLevel.ERROR]: 0,
      [LogLevel.CRITICAL]: 0,
      [LogLevel.FATAL]: 0
    };
  }

  /**
   * Получение статистики
   */
  public getStatistics() {
    return {
      sessionId: this.sessionId,
      totalEvents: this.events.length,
      errorCounts: this.errorCounts,
      errorRate: this.calculateErrorRate(),
      memoryUsage: this.getMemoryUsage(),
      isOnline: navigator.onLine
    };
  }
}

// Экспорт синглтона
export const diagnosticLogger = DiagnosticLogger.getInstance();

// Удобные хелперы
export const logDebug = (category: ErrorCategory, message: string, details?: any, context?: any) => {
  diagnosticLogger.log({ level: LogLevel.DEBUG, category, message, details, context, meta: {} });
};

export const logInfo = (category: ErrorCategory, message: string, details?: any, context?: any) => {
  diagnosticLogger.log({ level: LogLevel.INFO, category, message, details, context, meta: {} });
};

export const logWarn = (category: ErrorCategory, message: string, details?: any, context?: any) => {
  diagnosticLogger.log({ level: LogLevel.WARN, category, message, details, context, meta: {} });
};

export const logError = (category: ErrorCategory, message: string, details?: any, context?: any, stackTrace?: string) => {
  diagnosticLogger.log({ level: LogLevel.ERROR, category, message, details, context, stackTrace, meta: {} });
};

export const logCritical = (category: ErrorCategory, message: string, details?: any, context?: any, stackTrace?: string) => {
  diagnosticLogger.log({ level: LogLevel.CRITICAL, category, message, details, context, stackTrace, meta: {} });
};

export const logFatal = (category: ErrorCategory, message: string, details?: any, context?: any, stackTrace?: string) => {
  diagnosticLogger.log({ level: LogLevel.FATAL, category, message, details, context, stackTrace, meta: {} });
};
