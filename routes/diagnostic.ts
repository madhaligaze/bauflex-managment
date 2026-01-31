// routes/diagnostic.ts (Backend Route)

import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { databaseMonitor } from '../src/shared/lib/monitoring/DatabaseMonitor';

const router: Router = Router();
const prisma = new PrismaClient();

// Хранилище логов в памяти (в продакшене лучше использовать БД или внешний сервис)
const logsStorage: any[] = [];
const MAX_LOGS = 10000;

/**
 * POST /api/diagnostic/log
 * Приём логов от клиента
 */
router.post('/log', async (req, res) => {
  try {
    const logEntry = {
      ...req.body,
      receivedAt: new Date().toISOString(),
      ip: req.ip,
      userAgent: req.get('user-agent')
    };

    logsStorage.push(logEntry);

    // Ограничение размера хранилища
    if (logsStorage.length > MAX_LOGS) {
      logsStorage.splice(0, logsStorage.length - MAX_LOGS);
    }

    // Вывод критических логов в консоль сервера
    if (logEntry.level === 'CRITICAL' || logEntry.level === 'FATAL') {
      console.error(`
╔════════════════════════════════════════════════════════╗
║  🔥 CRITICAL CLIENT ERROR                              ║
║  Level: ${logEntry.level}                                        ║
║  Category: ${logEntry.category}                               ║
║  Message: ${logEntry.message}                         ║
║  Session: ${logEntry.sessionId}                       ║
║  URL: ${logEntry.url}                                  ║
╚════════════════════════════════════════════════════════╝
      `);
      
      if (logEntry.details) {
        console.error('Details:', JSON.stringify(logEntry.details, null, 2));
      }
      
      if (logEntry.stackTrace) {
        console.error('Stack:', logEntry.stackTrace);
      }
    }

    res.json({ success: true, id: logEntry.id });
  } catch (error: any) {
    console.error('Error saving diagnostic log:', error);
    res.status(500).json({ error: 'Failed to save log' });
  }
});

/**
 * GET /api/diagnostic/logs
 * Получение логов с фильтрацией
 */
router.get('/logs', (req, res) => {
  try {
    const { level, category, limit, sessionId } = req.query;

    let filtered = [...logsStorage];

    if (level) {
      filtered = filtered.filter(log => log.level === level);
    }

    if (category) {
      filtered = filtered.filter(log => log.category === category);
    }

    if (sessionId) {
      filtered = filtered.filter(log => log.sessionId === sessionId);
    }

    if (limit) {
      const limitNum = parseInt(limit as string);
      filtered = filtered.slice(-limitNum);
    }

    res.json({
      total: filtered.length,
      logs: filtered
    });
  } catch (error: any) {
    console.error('Error fetching logs:', error);
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
});

/**
 * GET /api/diagnostic/stats
 * Статистика по логам
 */
router.get('/stats', (req, res) => {
  try {
    const stats = {
      totalLogs: logsStorage.length,
      byLevel: {} as Record<string, number>,
      byCategory: {} as Record<string, number>,
      bySessions: new Set(logsStorage.map(log => log.sessionId)).size,
      lastHour: {
        total: 0,
        errors: 0,
        critical: 0
      }
    };

    const oneHourAgo = new Date(Date.now() - 3600000);

    for (const log of logsStorage) {
      // По уровням
      stats.byLevel[log.level] = (stats.byLevel[log.level] || 0) + 1;
      
      // По категориям
      stats.byCategory[log.category] = (stats.byCategory[log.category] || 0) + 1;

      // За последний час
      if (new Date(log.timestamp) > oneHourAgo) {
        stats.lastHour.total++;
        if (log.level === 'ERROR') stats.lastHour.errors++;
        if (log.level === 'CRITICAL' || log.level === 'FATAL') stats.lastHour.critical++;
      }
    }

    res.json(stats);
  } catch (error: any) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

/**
 * GET /api/diagnostic/health
 * Проверка здоровья системы (backend + database)
 */
router.get('/health', async (req, res) => {
  try {
    const health = {
      status: 'healthy' as 'healthy' | 'degraded' | 'critical',
      timestamp: new Date().toISOString(),
      backend: {
        uptime: process.uptime(),
        memory: {
          used: (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2) + ' MB',
          total: (process.memoryUsage().heapTotal / 1024 / 1024).toFixed(2) + ' MB',
          rss: (process.memoryUsage().rss / 1024 / 1024).toFixed(2) + ' MB'
        },
        cpu: process.cpuUsage()
      },
      database: await databaseMonitor.checkHealth(prisma),
      logs: {
        total: logsStorage.length,
        errors: logsStorage.filter(log => 
          log.level === 'ERROR' || log.level === 'CRITICAL' || log.level === 'FATAL'
        ).length
      }
    };

    // Определение общего статуса
    if (!health.database.connected) {
      health.status = 'critical';
    } else if (health.database.slowQueries > 10 || health.logs.errors > 20) {
      health.status = 'degraded';
    }

    const statusCode = health.status === 'healthy' ? 200 : 
                       health.status === 'degraded' ? 200 : 503;

    res.status(statusCode).json(health);
  } catch (error: any) {
    console.error('Error checking health:', error);
    res.status(503).json({
      status: 'critical',
      error: error.message
    });
  }
});

/**
 * GET /api/diagnostic/database/stats
 * Статистика базы данных
 */
router.get('/database/stats', (req, res) => {
  try {
    const stats = databaseMonitor.getStatistics();
    res.json(stats);
  } catch (error: any) {
    console.error('Error fetching database stats:', error);
    res.status(500).json({ error: 'Failed to fetch database stats' });
  }
});

/**
 * GET /api/diagnostic/database/queries
 * Запросы к базе данных
 */
router.get('/database/queries', (req, res) => {
  try {
    const { model, minDuration, withErrors, limit } = req.query;

    const queries = databaseMonitor.getQueries({
      model: model as string,
      minDuration: minDuration ? parseInt(minDuration as string) : undefined,
      withErrors: withErrors === 'true',
      limit: limit ? parseInt(limit as string) : undefined
    });

    res.json({
      total: queries.length,
      queries
    });
  } catch (error: any) {
    console.error('Error fetching database queries:', error);
    res.status(500).json({ error: 'Failed to fetch queries' });
  }
});

/**
 * GET /api/diagnostic/database/integrity
 * Проверка целостности данных
 */
router.get('/database/integrity', async (req, res) => {
  try {
    const issues = await databaseMonitor.analyzeDataIntegrity(prisma);
    
    res.json({
      healthy: issues.length === 0,
      issuesCount: issues.length,
      issues
    });
  } catch (error: any) {
    console.error('Error checking data integrity:', error);
    res.status(500).json({ error: 'Failed to check data integrity' });
  }
});

/**
 * POST /api/diagnostic/clear-logs
 * Очистка логов (только для админов)
 */
router.post('/clear-logs', (req, res) => {
  try {
    const clearedCount = logsStorage.length;
    logsStorage.length = 0;
    
    res.json({
      success: true,
      clearedCount
    });
  } catch (error: any) {
    console.error('Error clearing logs:', error);
    res.status(500).json({ error: 'Failed to clear logs' });
  }
});

/**
 * GET /api/diagnostic/export
 * Экспорт всех логов
 */
router.get('/export', (req, res) => {
  try {
    const data = {
      exportedAt: new Date().toISOString(),
      totalLogs: logsStorage.length,
      logs: logsStorage,
      databaseStats: databaseMonitor.getStatistics()
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=diagnostic-export-${Date.now()}.json`);
    res.send(JSON.stringify(data, null, 2));
  } catch (error: any) {
    console.error('Error exporting logs:', error);
    res.status(500).json({ error: 'Failed to export logs' });
  }
});

export default router;
