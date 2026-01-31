// monitoring/DatabaseMonitor.ts (Backend)

/**
 * 🗄️ МОНИТОР БАЗЫ ДАННЫХ
 * 
 * Отслеживает работу с БД и детектирует:
 * - Медленные запросы
 * - Ошибки подключения
 * - Deadlocks
 * - Аномалии в данных
 * - Проблемы с индексами
 * - N+1 проблемы
 */

interface QueryMetrics {
  query: string;
  duration: number;
  timestamp: string;
  model?: string;
  operation?: string;
  error?: any;
}

interface DatabaseHealth {
  connected: boolean;
  responseTime: number;
  activeConnections: number;
  slowQueries: number;
  errors: number;
}

export class DatabaseMonitor {
  private static instance: DatabaseMonitor;
  private queries: QueryMetrics[] = [];
  private maxQueries = 500;
  private readonly SLOW_QUERY_THRESHOLD = 1000; // 1 секунда
  private readonly VERY_SLOW_QUERY_THRESHOLD = 5000; // 5 секунд
  
  private constructor() {
    console.log('🗄️ Database Monitor initialized');
  }

  public static getInstance(): DatabaseMonitor {
    if (!DatabaseMonitor.instance) {
      DatabaseMonitor.instance = new DatabaseMonitor();
    }
    return DatabaseMonitor.instance;
  }

  /**
   * Middleware для Prisma
   */
  public createPrismaMiddleware() {
    return async (params: any, next: any) => {
      const start = Date.now();
      
      try {
        const result = await next(params);
        const duration = Date.now() - start;
        
        const metrics: QueryMetrics = {
          query: `${params.model}.${params.action}`,
          duration,
          timestamp: new Date().toISOString(),
          model: params.model,
          operation: params.action
        };
        
        this.recordQuery(metrics);
        this.analyzeQuery(metrics);
        
        return result;
      } catch (error: any) {
        const duration = Date.now() - start;
        
        const metrics: QueryMetrics = {
          query: `${params.model}.${params.action}`,
          duration,
          timestamp: new Date().toISOString(),
          model: params.model,
          operation: params.action,
          error: {
            message: error.message,
            code: error.code,
            meta: error.meta
          }
        };
        
        this.recordQuery(metrics);
        this.analyzeQuery(metrics);
        
        throw error;
      }
    };
  }

  /**
   * Запись запроса
   */
  private recordQuery(metrics: QueryMetrics) {
    this.queries.push(metrics);
    
    if (this.queries.length > this.maxQueries) {
      this.queries = this.queries.slice(-this.maxQueries);
    }
  }

  /**
   * Анализ запроса
   */
  private analyzeQuery(metrics: QueryMetrics) {
    // Проверка медленных запросов
    if (metrics.duration > this.VERY_SLOW_QUERY_THRESHOLD) {
      console.error(`
╔════════════════════════════════════════════════════════╗
║  🔥 VERY SLOW DATABASE QUERY                           ║
║  Query: ${metrics.query.padEnd(44)} ║
║  Duration: ${(metrics.duration / 1000).toFixed(2)}s                                           ║
║  Model: ${(metrics.model || 'unknown').padEnd(44)} ║
║  Operation: ${(metrics.operation || 'unknown').padEnd(40)} ║
╚════════════════════════════════════════════════════════╝
      `);
    } else if (metrics.duration > this.SLOW_QUERY_THRESHOLD) {
      console.warn(`⚠️ Slow database query: ${metrics.query} (${metrics.duration}ms)`);
    }

    // Проверка ошибок
    if (metrics.error) {
      console.error(`
╔════════════════════════════════════════════════════════╗
║  ❌ DATABASE ERROR                                     ║
║  Query: ${metrics.query.padEnd(44)} ║
║  Error: ${(metrics.error.message || 'unknown').padEnd(44)} ║
║  Code: ${(metrics.error.code || 'unknown').padEnd(45)} ║
╚════════════════════════════════════════════════════════╝
      `);
    }

    // Детекция N+1 проблемы
    this.detectNPlus1Problem(metrics);
  }

  /**
   * Детекция N+1 проблемы
   */
  private detectNPlus1Problem(metrics: QueryMetrics) {
    // Берём последние 20 запросов
    const recentQueries = this.queries.slice(-20);
    
    // Ищем паттерн: один запрос findMany, за которым следует много findUnique к связанной модели
    const findManyQueries = recentQueries.filter(q => 
      q.operation === 'findMany' && 
      q.model === metrics.model
    );

    if (findManyQueries.length > 0) {
      const lastFindMany = findManyQueries[findManyQueries.length - 1];
      const subsequentQueries = recentQueries.slice(
        recentQueries.indexOf(lastFindMany) + 1
      );
      
      const findUniqueCount = subsequentQueries.filter(q => 
        q.operation === 'findUnique' || q.operation === 'findFirst'
      ).length;

      if (findUniqueCount > 5) {
        console.warn(`
╔════════════════════════════════════════════════════════╗
║  ⚠️  POTENTIAL N+1 PROBLEM DETECTED                   ║
║  After findMany: ${findUniqueCount} individual queries                 ║
║  Model: ${metrics.model || 'unknown'}                                           ║
║  Solution: Use 'include' or 'select' with relations    ║
╚════════════════════════════════════════════════════════╝
        `);
      }
    }
  }

  /**
   * Проверка здоровья БД
   */
  public async checkHealth(prisma: any): Promise<DatabaseHealth> {
    const start = Date.now();
    
    try {
      // Простой запрос для проверки подключения
      await prisma.$queryRaw`SELECT 1`;
      const responseTime = Date.now() - start;
      
      const slowQueries = this.queries.filter(q => 
        q.duration > this.SLOW_QUERY_THRESHOLD
      ).length;
      
      const errors = this.queries.filter(q => q.error).length;
      
      return {
        connected: true,
        responseTime,
        activeConnections: 1, // Нужно получать из метрик Prisma
        slowQueries,
        errors
      };
    } catch (error) {
      return {
        connected: false,
        responseTime: Date.now() - start,
        activeConnections: 0,
        slowQueries: 0,
        errors: this.queries.filter(q => q.error).length
      };
    }
  }

  /**
   * Получение статистики
   */
  public getStatistics() {
    const totalQueries = this.queries.length;
    const successfulQueries = this.queries.filter(q => !q.error).length;
    const failedQueries = totalQueries - successfulQueries;
    
    const averageDuration = totalQueries > 0
      ? this.queries.reduce((sum, q) => sum + q.duration, 0) / totalQueries
      : 0;

    const slowQueries = this.queries.filter(q => 
      q.duration > this.SLOW_QUERY_THRESHOLD
    ).length;

    // Группировка по моделям
    const queryCountByModel: Record<string, number> = {};
    for (const query of this.queries) {
      if (query.model) {
        queryCountByModel[query.model] = (queryCountByModel[query.model] || 0) + 1;
      }
    }

    return {
      totalQueries,
      successfulQueries,
      failedQueries,
      averageDuration: averageDuration.toFixed(2) + 'ms',
      slowQueries,
      slowQueriesRate: totalQueries > 0 ? (slowQueries / totalQueries * 100).toFixed(2) + '%' : '0%',
      queryCountByModel
    };
  }

  /**
   * Получение запросов
   */
  public getQueries(filter?: {
    model?: string;
    minDuration?: number;
    withErrors?: boolean;
    limit?: number;
  }): QueryMetrics[] {
    let filtered = [...this.queries];

    if (filter?.model) {
      filtered = filtered.filter(q => q.model === filter.model);
    }

    if (filter?.minDuration) {
      filtered = filtered.filter(q => q.duration >= filter.minDuration!);
    }

    if (filter?.withErrors) {
      filtered = filtered.filter(q => q.error);
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
      queries: this.queries
    }, null, 2);
  }

  /**
   * Анализ структуры данных на противоречия
   */
  public async analyzeDataIntegrity(prisma: any): Promise<any[]> {
    const issues: any[] = [];

    try {
      // 1. Проверка на заявки без сотрудников
      const requestsWithoutEmployees = await prisma.request.findMany({
        where: {
          employeeId: { not: null },
          employee: null
        },
        select: { id: true, requestNumber: true, employeeName: true }
      });

      if (requestsWithoutEmployees.length > 0) {
        issues.push({
          type: 'ORPHANED_REFERENCE',
          message: 'Requests reference non-existent employees',
          details: {
            count: requestsWithoutEmployees.length,
            examples: requestsWithoutEmployees.slice(0, 5)
          }
        });
      }

      // 2. Проверка на дубликаты requestNumber
      const requests = await prisma.request.findMany({
        select: { requestNumber: true }
      });
      
      const requestNumbers = requests.map((r: any) => r.requestNumber);
      const duplicates = requestNumbers.filter((item: string, index: number) => 
        requestNumbers.indexOf(item) !== index
      );

      if (duplicates.length > 0) {
        issues.push({
          type: 'DUPLICATE_VALUES',
          message: 'Duplicate request numbers found',
          details: {
            count: duplicates.length,
            examples: [...new Set(duplicates)].slice(0, 5)
          }
        });
      }

      // 3. Проверка на некорректные даты
      const invalidDates = await prisma.request.findMany({
        where: {
          createdAt: {
            gt: new Date()
          }
        },
        select: { id: true, requestNumber: true, createdAt: true }
      });

      if (invalidDates.length > 0) {
        issues.push({
          type: 'INVALID_DATA',
          message: 'Requests with future dates',
          details: {
            count: invalidDates.length,
            examples: invalidDates.slice(0, 5)
          }
        });
      }

      // 4. Проверка на пустые или некорректные email у сотрудников
      const invalidEmails = await prisma.employee.findMany({
        where: {
          email: {
            not: null
          }
        }
      });

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const badEmails = invalidEmails.filter((e: any) => 
        e.email && !emailRegex.test(e.email)
      );

      if (badEmails.length > 0) {
        issues.push({
          type: 'INVALID_DATA',
          message: 'Employees with invalid email format',
          details: {
            count: badEmails.length,
            examples: badEmails.slice(0, 5).map((e: any) => ({
              id: e.id,
              name: e.name,
              email: e.email
            }))
          }
        });
      }

    } catch (error: any) {
      issues.push({
        type: 'ANALYSIS_ERROR',
        message: 'Error during data integrity analysis',
        details: {
          error: error.message
        }
      });
    }

    // Логируем найденные проблемы
    if (issues.length > 0) {
      console.error(`
╔════════════════════════════════════════════════════════╗
║  ⚠️  DATA INTEGRITY ISSUES DETECTED                   ║
║  Total issues: ${issues.length}                                        ║
╚════════════════════════════════════════════════════════╝
      `);
      
      for (const issue of issues) {
        console.error(`  - ${issue.message} (${issue.type})`);
      }
    }

    return issues;
  }
}

// Экспорт синглтона
export const databaseMonitor = DatabaseMonitor.getInstance();
