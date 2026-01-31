// src/shared/lib/monitoring/APIMonitor.ts

import { diagnosticLogger, LogLevel, ErrorCategory } from './DiagnosticLogger';

/**
 * 🌐 МОНИТОР API ЗАПРОСОВ
 * 
 * Отслеживает все API вызовы и детектирует:
 * - Медленные запросы
 * - Ошибки сети
 * - Таймауты
 * - Некорректные ответы
 * - Rate limiting
 * - Аномалии в паттернах запросов
 */

export interface APICallMetrics {
  url: string;
  method: string;
  status: number;
  duration: number;
  size: number;
  timestamp: string;
  success: boolean;
  error?: any;
}

export class APIMonitor {
  private static instance: APIMonitor;
  private calls: APICallMetrics[] = [];
  private maxCalls = 500;
  
  // Пороги для детекции проблем
  private readonly SLOW_REQUEST_THRESHOLD = 3000; // 3 секунды
  private readonly VERY_SLOW_REQUEST_THRESHOLD = 10000; // 10 секунд
  private readonly ERROR_RATE_THRESHOLD = 0.2; // 20% ошибок
  private readonly TIMEOUT_THRESHOLD = 30000; // 30 секунд

  private constructor() {
    this.interceptFetch();
    this.interceptXHR();
    console.log('📡 API Monitor initialized');
  }

  public static getInstance(): APIMonitor {
    if (!APIMonitor.instance) {
      APIMonitor.instance = new APIMonitor();
    }
    return APIMonitor.instance;
  }

  /**
   * Перехват Fetch API
   */
  private interceptFetch() {
    const originalFetch = window.fetch;
    
    window.fetch = async (...args) => {
      const startTime = performance.now();
      const url = typeof args[0] === 'string' ? args[0] : args[0]?.url || 'unknown';
      const method = args[1]?.method || 'GET';

      try {
        const response = await originalFetch(...args);
        const endTime = performance.now();
        const duration = endTime - startTime;

        // Клонируем response для чтения body
        const clonedResponse = response.clone();
        let size = 0;
        
        try {
          const blob = await clonedResponse.blob();
          size = blob.size;
        } catch (e) {
          // Не удалось получить размер
        }

        const metrics: APICallMetrics = {
          url,
          method,
          status: response.status,
          duration,
          size,
          timestamp: new Date().toISOString(),
          success: response.ok
        };

        this.recordCall(metrics);
        this.analyzeCall(metrics);

        return response;
      } catch (error: any) {
        const endTime = performance.now();
        const duration = endTime - startTime;

        const metrics: APICallMetrics = {
          url,
          method,
          status: 0,
          duration,
          size: 0,
          timestamp: new Date().toISOString(),
          success: false,
          error: {
            message: error.message,
            name: error.name,
            stack: error.stack
          }
        };

        this.recordCall(metrics);
        this.analyzeCall(metrics);

        // Логируем ошибку
        diagnosticLogger.log({
          level: LogLevel.ERROR,
          category: ErrorCategory.API,
          message: `API call failed: ${method} ${url}`,
          details: {
            error: error.message,
            duration,
            method,
            url
          },
          stackTrace: error.stack,
          context: { type: 'api_error' },
          meta: {}
        });

        throw error;
      }
    };
  }

  /**
   * Перехват XMLHttpRequest
   */
  private interceptXHR() {
    const originalOpen = XMLHttpRequest.prototype.open;
    const originalSend = XMLHttpRequest.prototype.send;

    XMLHttpRequest.prototype.open = function(method: string, url: string, ...rest: any[]) {
      (this as any)._url = url;
      (this as any)._method = method;
      (this as any)._startTime = performance.now();
      return originalOpen.call(this, method, url, ...rest);
    };

    XMLHttpRequest.prototype.send = function(...args: any[]) {
      this.addEventListener('load', function() {
        const endTime = performance.now();
        const duration = endTime - (this as any)._startTime;
        
        const metrics: APICallMetrics = {
          url: (this as any)._url,
          method: (this as any)._method,
          status: this.status,
          duration,
          size: this.responseText?.length || 0,
          timestamp: new Date().toISOString(),
          success: this.status >= 200 && this.status < 300
        };

        APIMonitor.getInstance().recordCall(metrics);
        APIMonitor.getInstance().analyzeCall(metrics);
      });

      this.addEventListener('error', function() {
        const endTime = performance.now();
        const duration = endTime - (this as any)._startTime;

        const metrics: APICallMetrics = {
          url: (this as any)._url,
          method: (this as any)._method,
          status: 0,
          duration,
          size: 0,
          timestamp: new Date().toISOString(),
          success: false,
          error: { message: 'Network error' }
        };

        APIMonitor.getInstance().recordCall(metrics);
        APIMonitor.getInstance().analyzeCall(metrics);
      });

      return originalSend.apply(this, args);
    };
  }

  /**
   * Запись вызова
   */
  private recordCall(metrics: APICallMetrics) {
    this.calls.push(metrics);
    
    if (this.calls.length > this.maxCalls) {
      this.calls = this.calls.slice(-this.maxCalls);
    }
  }

  /**
   * Анализ вызова на аномалии
   */
  private analyzeCall(metrics: APICallMetrics) {
    // 1. Проверка на медленный запрос
    if (metrics.duration > this.VERY_SLOW_REQUEST_THRESHOLD) {
      diagnosticLogger.log({
        level: LogLevel.CRITICAL,
        category: ErrorCategory.PERFORMANCE,
        message: `Very slow API call detected: ${metrics.method} ${metrics.url}`,
        details: {
          duration: `${(metrics.duration / 1000).toFixed(2)}s`,
          threshold: `${this.VERY_SLOW_REQUEST_THRESHOLD / 1000}s`,
          status: metrics.status
        },
        context: { type: 'very_slow_api' },
        meta: {}
      });
    } else if (metrics.duration > this.SLOW_REQUEST_THRESHOLD) {
      diagnosticLogger.log({
        level: LogLevel.WARN,
        category: ErrorCategory.PERFORMANCE,
        message: `Slow API call: ${metrics.method} ${metrics.url}`,
        details: {
          duration: `${(metrics.duration / 1000).toFixed(2)}s`,
          threshold: `${this.SLOW_REQUEST_THRESHOLD / 1000}s`
        },
        context: { type: 'slow_api' },
        meta: {}
      });
    }

    // 2. Проверка статус кодов
    if (!metrics.success) {
      const level = metrics.status === 0 ? LogLevel.ERROR : 
                   metrics.status >= 500 ? LogLevel.CRITICAL : LogLevel.WARN;
      
      diagnosticLogger.log({
        level,
        category: ErrorCategory.API,
        message: `API call failed: ${metrics.method} ${metrics.url}`,
        details: {
          status: metrics.status,
          duration: metrics.duration,
          error: metrics.error
        },
        context: { type: 'api_error_status' },
        meta: {}
      });
    }

    // 3. Проверка размера ответа
    if (metrics.size > 5 * 1024 * 1024) { // Больше 5MB
      diagnosticLogger.log({
        level: LogLevel.WARN,
        category: ErrorCategory.PERFORMANCE,
        message: `Large API response: ${metrics.method} ${metrics.url}`,
        details: {
          size: `${(metrics.size / 1024 / 1024).toFixed(2)}MB`,
          duration: metrics.duration
        },
        context: { type: 'large_response' },
        meta: {}
      });
    }

    // 4. Проверка паттернов (если много ошибок к одному endpoint)
    this.checkErrorPatterns(metrics);
  }

  /**
   * Проверка паттернов ошибок
   */
  private checkErrorPatterns(metrics: APICallMetrics) {
    // Берём последние 10 вызовов к этому же endpoint
    const recentCalls = this.calls
      .filter(c => c.url === metrics.url)
      .slice(-10);

    if (recentCalls.length >= 5) {
      const errorCount = recentCalls.filter(c => !c.success).length;
      const errorRate = errorCount / recentCalls.length;

      if (errorRate >= this.ERROR_RATE_THRESHOLD) {
        diagnosticLogger.log({
          level: LogLevel.CRITICAL,
          category: ErrorCategory.API,
          message: `High error rate detected for endpoint: ${metrics.url}`,
          details: {
            errorRate: `${(errorRate * 100).toFixed(1)}%`,
            errorCount,
            totalCalls: recentCalls.length,
            threshold: `${this.ERROR_RATE_THRESHOLD * 100}%`
          },
          context: { type: 'error_pattern' },
          meta: {}
        });
      }
    }
  }

  /**
   * Получение статистики
   */
  public getStatistics() {
    const totalCalls = this.calls.length;
    const successfulCalls = this.calls.filter(c => c.success).length;
    const failedCalls = totalCalls - successfulCalls;
    
    const averageDuration = totalCalls > 0 
      ? this.calls.reduce((sum, c) => sum + c.duration, 0) / totalCalls 
      : 0;

    const slowCalls = this.calls.filter(c => c.duration > this.SLOW_REQUEST_THRESHOLD).length;

    return {
      totalCalls,
      successfulCalls,
      failedCalls,
      successRate: totalCalls > 0 ? (successfulCalls / totalCalls * 100).toFixed(2) + '%' : '0%',
      averageDuration: averageDuration.toFixed(2) + 'ms',
      slowCalls,
      slowCallsRate: totalCalls > 0 ? (slowCalls / totalCalls * 100).toFixed(2) + '%' : '0%'
    };
  }

  /**
   * Получение вызовов с фильтром
   */
  public getCalls(filter?: {
    success?: boolean;
    minDuration?: number;
    limit?: number;
  }): APICallMetrics[] {
    let filtered = [...this.calls];

    if (filter?.success !== undefined) {
      filtered = filtered.filter(c => c.success === filter.success);
    }

    if (filter?.minDuration) {
      filtered = filtered.filter(c => c.duration >= filter.minDuration!);
    }

    if (filter?.limit) {
      filtered = filtered.slice(-filter.limit);
    }

    return filtered;
  }

  /**
   * Экспорт данных
   */
  public export(): string {
    return JSON.stringify({
      timestamp: new Date().toISOString(),
      statistics: this.getStatistics(),
      calls: this.calls
    }, null, 2);
  }
}

// Инициализация монитора
export const apiMonitor = APIMonitor.getInstance();
