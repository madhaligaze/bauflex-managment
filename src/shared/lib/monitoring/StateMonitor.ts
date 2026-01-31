// src/shared/lib/monitoring/StateMonitor.ts

import { diagnosticLogger, LogLevel, ErrorCategory } from './DiagnosticLogger';

/**
 * 🔄 МОНИТОР СОСТОЯНИЯ ПРИЛОЖЕНИЯ
 * 
 * Отслеживает состояние Zustand store и детектирует:
 * - Противоречия в данных
 * - Некорректные переходы состояний
 * - Дублирование данных
 * - Несинхронизированные данные
 * - Memory leaks в state
 * - Циклические зависимости
 */

export interface StateSnapshot {
  timestamp: string;
  storeName: string;
  state: any;
  actionName?: string;
}

export interface StateViolation {
  type: 'CONTRADICTION' | 'INVALID_TRANSITION' | 'DUPLICATE' | 'MEMORY_LEAK' | 'CIRCULAR_REF';
  message: string;
  details: any;
}

export class StateMonitor {
  private static instance: StateMonitor;
  private snapshots: StateSnapshot[] = [];
  private maxSnapshots = 100;
  private violations: StateViolation[] = [];
  
  // Правила валидации состояния
  private validationRules: Array<{
    name: string;
    check: (state: any) => StateViolation | null;
  }> = [];

  private constructor() {
    this.initializeValidationRules();
    console.log('🔄 State Monitor initialized');
  }

  public static getInstance(): StateMonitor {
    if (!StateMonitor.instance) {
      StateMonitor.instance = new StateMonitor();
    }
    return StateMonitor.instance;
  }

  /**
   * Инициализация правил валидации
   */
  private initializeValidationRules() {
    // Правило 1: Проверка дубликатов в массивах
    this.addRule('no-duplicates-in-arrays', (state) => {
      if (state.requests && Array.isArray(state.requests)) {
        const ids = state.requests.map((r: any) => r.id);
        const uniqueIds = new Set(ids);
        
        if (ids.length !== uniqueIds.size) {
          return {
            type: 'DUPLICATE',
            message: 'Duplicate IDs found in requests array',
            details: {
              totalCount: ids.length,
              uniqueCount: uniqueIds.size,
              duplicateCount: ids.length - uniqueIds.size
            }
          };
        }
      }
      return null;
    });

    // Правило 2: Проверка противоречий в статусах заявок
    this.addRule('valid-request-status', (state) => {
      if (state.requests && Array.isArray(state.requests)) {
        for (const request of state.requests) {
          const validStatuses = ['Новая', 'В работе', 'Завершена'];
          if (request.status && !validStatuses.includes(request.status)) {
            return {
              type: 'CONTRADICTION',
              message: `Invalid request status: "${request.status}"`,
              details: {
                requestId: request.id,
                invalidStatus: request.status,
                validStatuses
              }
            };
          }
        }
      }
      return null;
    });

    // Правило 3: Проверка типов заявок
    this.addRule('valid-request-type', (state) => {
      if (state.requests && Array.isArray(state.requests)) {
        for (const request of state.requests) {
          const validTypes = ['siz', 'tools', 'equipment', 'consumables'];
          if (request.type && !validTypes.includes(request.type)) {
            return {
              type: 'CONTRADICTION',
              message: `Invalid request type: "${request.type}"`,
              details: {
                requestId: request.id,
                invalidType: request.type,
                validTypes
              }
            };
          }
        }
      }
      return null;
    });

    // Правило 4: Проверка, что у заявки есть все необходимые поля
    this.addRule('request-required-fields', (state) => {
      if (state.requests && Array.isArray(state.requests)) {
        for (const request of state.requests) {
          const requiredFields = ['id', 'type', 'user', 'date', 'status'];
          const missingFields = requiredFields.filter(field => !request[field]);
          
          if (missingFields.length > 0) {
            return {
              type: 'CONTRADICTION',
              message: 'Request missing required fields',
              details: {
                requestId: request.id || 'unknown',
                missingFields,
                request
              }
            };
          }
        }
      }
      return null;
    });

    // Правило 5: Проверка размера состояния (memory leak detection)
    this.addRule('state-size-check', (state) => {
      const stateSize = JSON.stringify(state).length;
      const MAX_STATE_SIZE = 10 * 1024 * 1024; // 10MB
      
      if (stateSize > MAX_STATE_SIZE) {
        return {
          type: 'MEMORY_LEAK',
          message: 'State size exceeds threshold',
          details: {
            currentSize: `${(stateSize / 1024 / 1024).toFixed(2)}MB`,
            threshold: `${(MAX_STATE_SIZE / 1024 / 1024).toFixed(2)}MB`,
            warning: 'Potential memory leak detected'
          }
        };
      }
      return null;
    });

    // Правило 6: Проверка циклических ссылок
    this.addRule('no-circular-references', (state) => {
      try {
        JSON.stringify(state);
        return null;
      } catch (error: any) {
        if (error.message.includes('circular')) {
          return {
            type: 'CIRCULAR_REF',
            message: 'Circular reference detected in state',
            details: {
              error: error.message
            }
          };
        }
        return null;
      }
    });

    // Правило 7: Проверка согласованности дат
    this.addRule('valid-dates', (state) => {
      if (state.requests && Array.isArray(state.requests)) {
        for (const request of state.requests) {
          if (request.date) {
            const date = new Date(request.date);
            if (isNaN(date.getTime())) {
              return {
                type: 'CONTRADICTION',
                message: 'Invalid date format in request',
                details: {
                  requestId: request.id,
                  invalidDate: request.date
                }
              };
            }
            
            // Проверка, что дата не в будущем
            if (date > new Date()) {
              return {
                type: 'CONTRADICTION',
                message: 'Request date is in the future',
                details: {
                  requestId: request.id,
                  date: request.date,
                  now: new Date().toISOString()
                }
              };
            }
          }
        }
      }
      return null;
    });

    // Правило 8: Проверка сотрудников
    this.addRule('valid-employees', (state) => {
      if (state.employees && Array.isArray(state.employees)) {
        for (const employee of state.employees) {
          // Проверка обязательных полей
          if (!employee.id || !employee.fullName) {
            return {
              type: 'CONTRADICTION',
              message: 'Employee missing required fields',
              details: {
                employee,
                required: ['id', 'fullName']
              }
            };
          }
          
          // Проверка формата email (если указан)
          if (employee.email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(employee.email)) {
              return {
                type: 'CONTRADICTION',
                message: 'Invalid employee email format',
                details: {
                  employeeId: employee.id,
                  email: employee.email
                }
              };
            }
          }
        }
      }
      return null;
    });

    // Правило 9: Проверка, что details в заявках корректны
    this.addRule('valid-request-details', (state) => {
      if (state.requests && Array.isArray(state.requests)) {
        for (const request of state.requests) {
          if (request.type === 'siz' && request.details) {
            // Для СИЗ должны быть все размеры
            const requiredSizFields = ['clothingSeason', 'shoeSeason', 'height', 'clothingSize', 'shoeSize'];
            const missingFields = requiredSizFields.filter(field => !request.details[field]);
            
            if (missingFields.length > 0) {
              return {
                type: 'CONTRADICTION',
                message: 'SIZ request missing size details',
                details: {
                  requestId: request.id,
                  missingFields
                }
              };
            }
          }
          
          if (['tools', 'equipment', 'consumables'].includes(request.type) && request.details) {
            // Для остальных типов должен быть массив с позициями
            if (!Array.isArray(request.details)) {
              return {
                type: 'CONTRADICTION',
                message: 'Non-SIZ request details should be an array',
                details: {
                  requestId: request.id,
                  type: request.type,
                  detailsType: typeof request.details
                }
              };
            }
          }
        }
      }
      return null;
    });
  }

  /**
   * Добавление правила валидации
   */
  public addRule(name: string, check: (state: any) => StateViolation | null) {
    this.validationRules.push({ name, check });
  }

  /**
   * Создание снимка состояния
   */
  public snapshot(storeName: string, state: any, actionName?: string) {
    const snapshot: StateSnapshot = {
      timestamp: new Date().toISOString(),
      storeName,
      state: JSON.parse(JSON.stringify(state)), // Deep clone
      actionName
    };

    this.snapshots.push(snapshot);
    
    if (this.snapshots.length > this.maxSnapshots) {
      this.snapshots = this.snapshots.slice(-this.maxSnapshots);
    }

    // Валидация состояния
    this.validateState(storeName, state, actionName);
  }

  /**
   * Валидация состояния
   */
  private validateState(storeName: string, state: any, actionName?: string) {
    for (const rule of this.validationRules) {
      const violation = rule.check(state);
      
      if (violation) {
        this.violations.push(violation);
        
        diagnosticLogger.log({
          level: violation.type === 'MEMORY_LEAK' || violation.type === 'CIRCULAR_REF' 
            ? LogLevel.CRITICAL 
            : LogLevel.ERROR,
          category: ErrorCategory.STATE,
          message: `State validation failed: ${violation.message}`,
          details: {
            storeName,
            actionName,
            rule: rule.name,
            violation: violation.details
          },
          context: { 
            type: 'state_violation',
            violationType: violation.type
          },
          meta: {}
        });
      }
    }
  }

  /**
   * Проверка перехода состояния
   */
  public validateTransition(storeName: string, previousState: any, newState: any, actionName: string) {
    // Логика проверки корректности перехода
    // Например, статус заявки не может измениться с "Завершена" на "Новая"
    
    if (previousState.requests && newState.requests) {
      for (let i = 0; i < Math.min(previousState.requests.length, newState.requests.length); i++) {
        const oldReq = previousState.requests[i];
        const newReq = newState.requests[i];
        
        if (oldReq.id === newReq.id && oldReq.status !== newReq.status) {
          // Проверка недопустимых переходов
          const invalidTransitions = [
            ['Завершена', 'Новая'],
            ['Завершена', 'В работе']
          ];
          
          for (const [from, to] of invalidTransitions) {
            if (oldReq.status === from && newReq.status === to) {
              diagnosticLogger.log({
                level: LogLevel.ERROR,
                category: ErrorCategory.STATE,
                message: `Invalid state transition detected`,
                details: {
                  storeName,
                  actionName,
                  requestId: oldReq.id,
                  from: oldReq.status,
                  to: newReq.status,
                  reason: 'Completed requests cannot be reopened'
                },
                context: { type: 'invalid_transition' },
                meta: {}
              });
            }
          }
        }
      }
    }
  }

  /**
   * Получение нарушений
   */
  public getViolations(filter?: { type?: StateViolation['type'] }): StateViolation[] {
    if (filter?.type) {
      return this.violations.filter(v => v.type === filter.type);
    }
    return this.violations;
  }

  /**
   * Получение снимков
   */
  public getSnapshots(filter?: { storeName?: string; limit?: number }): StateSnapshot[] {
    let filtered = [...this.snapshots];
    
    if (filter?.storeName) {
      filtered = filtered.filter(s => s.storeName === filter.storeName);
    }
    
    if (filter?.limit) {
      filtered = filtered.slice(-filter.limit);
    }
    
    return filtered;
  }

  /**
   * Сравнение двух состояний
   */
  public diffStates(state1: any, state2: any): any {
    const diff: any = {};
    
    const compareObjects = (obj1: any, obj2: any, path: string = '') => {
      const keys = new Set([...Object.keys(obj1), ...Object.keys(obj2)]);
      
      for (const key of keys) {
        const fullPath = path ? `${path}.${key}` : key;
        
        if (!(key in obj1)) {
          diff[fullPath] = { type: 'added', value: obj2[key] };
        } else if (!(key in obj2)) {
          diff[fullPath] = { type: 'removed', value: obj1[key] };
        } else if (JSON.stringify(obj1[key]) !== JSON.stringify(obj2[key])) {
          if (typeof obj1[key] === 'object' && typeof obj2[key] === 'object') {
            compareObjects(obj1[key], obj2[key], fullPath);
          } else {
            diff[fullPath] = { type: 'changed', from: obj1[key], to: obj2[key] };
          }
        }
      }
    };
    
    compareObjects(state1, state2);
    return diff;
  }

  /**
   * Экспорт данных
   */
  public export(): string {
    return JSON.stringify({
      timestamp: new Date().toISOString(),
      snapshots: this.snapshots,
      violations: this.violations,
      statistics: {
        totalSnapshots: this.snapshots.length,
        totalViolations: this.violations.length,
        violationsByType: this.getViolationStats()
      }
    }, null, 2);
  }

  /**
   * Статистика по нарушениям
   */
  private getViolationStats() {
    const stats: Record<string, number> = {};
    
    for (const violation of this.violations) {
      stats[violation.type] = (stats[violation.type] || 0) + 1;
    }
    
    return stats;
  }
}

// Экспорт синглтона
export const stateMonitor = StateMonitor.getInstance();

/**
 * HOC для мониторинга Zustand store
 */
export function withStateMonitoring<T>(
  storeName: string,
  store: any
): any {
  const originalCreate = store;
  
  return (...args: any[]) => {
    const result = originalCreate(...args);
    const [state, setState] = result;
    
    // Создаём снимок начального состояния
    stateMonitor.snapshot(storeName, state);
    
    // Перехватываем все изменения состояния
    const monitoredSetState = (partial: any, replace?: boolean, action?: string) => {
      const previousState = JSON.parse(JSON.stringify(state));
      const result = setState(partial, replace);
      const newState = JSON.parse(JSON.stringify(state));
      
      // Создаём снимок
      stateMonitor.snapshot(storeName, newState, action);
      
      // Проверяем переход
      stateMonitor.validateTransition(storeName, previousState, newState, action || 'unknown');
      
      return result;
    };
    
    return [state, monitoredSetState];
  };
}
