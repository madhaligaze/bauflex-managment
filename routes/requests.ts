import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router: Router = Router();
const prisma = new PrismaClient();

// Функция для генерации уникального номера заявки
function generateRequestNumber(): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `REQ-${timestamp}-${random}`;
}

// Получить все заявки (для админки)
router.get('/', async (req, res) => {
  try {
    const requests = await prisma.request.findMany({ 
      orderBy: { createdAt: 'desc' },
      include: {
        employee: true // Подтягиваем связанного сотрудника
      }
    });
    
    // Форматируем ответ для фронтенда
    const formatted = requests.map(req => ({
      id: String(req.id),
      type: extractTypeFromDetails(req), // Извлекаем тип из деталей
      user: req.employee ? req.employee.name : (req.employeeName || 'Неизвестно'),
      date: req.createdAt.toISOString(),
      status: mapStatus(req.status),
      details: parseDetails(req),
      createdAt: req.createdAt.toISOString(),
      requestNumber: req.requestNumber
    }));
    
    res.json(formatted);
  } catch (error) {
    console.error('Error fetching requests:', error);
    res.status(500).json({ error: 'Ошибка при получении заявок' });
  }
});

// Вспомогательные функции для преобразования данных
function extractTypeFromDetails(request: any): string {
  // Пытаемся определить тип по notes или purpose
  if (request.notes?.includes('СИЗ') || request.purpose?.includes('СИЗ')) return 'siz';
  if (request.notes?.includes('Инструмент') || request.purpose?.includes('Инструмент')) return 'tools';
  if (request.notes?.includes('Оборудование') || request.purpose?.includes('Оборудование')) return 'equipment';
  if (request.notes?.includes('Расходник') || request.purpose?.includes('Расходник')) return 'consumables';
  return 'equipment'; // По умолчанию
}

function mapStatus(status: string): 'Новая' | 'В работе' | 'Завершена' {
  if (status === 'approved' || status === 'completed') return 'Завершена';
  if (status === 'in_progress' || status === 'processing') return 'В работе';
  return 'Новая';
}

function parseDetails(request: any) {
  // Восстанавливаем детали из полей БД
  return {
    itemName: request.itemName,
    quantity: request.quantity,
    unit: request.unit,
    urgency: request.urgency,
    purpose: request.purpose,
    notes: request.notes
  };
}

// Создать новую заявку (из клиентской формы)
router.post('/', async (req, res) => {
  try {
    const { type, user, details } = req.body;
    
    console.log('📝 Получена заявка:', { type, user, details });
    
    // Ищем сотрудника по имени
    let employeeId = null;
    let employeeName = user;
    
    if (user && user.trim()) {
      const employee = await prisma.employee.findFirst({
        where: {
          name: {
            contains: user.trim(),
            mode: 'insensitive'
          }
        }
      });
      
      if (employee) {
        employeeId = employee.id;
        console.log(`✅ Найден сотрудник в БД: ${employee.name} (ID: ${employee.id})`);
      } else {
        console.log(`⚠️ Сотрудник "${user}" не найден в БД, сохраняем как текст`);
      }
    }
    
    // Генерируем уникальный номер заявки
    const requestNumber = generateRequestNumber();
    
    // Обрабатываем детали в зависимости от типа заявки
    let requestData;
    
    if (type === 'siz') {
      // Для СИЗ детали содержат размеры одежды
      requestData = {
        requestNumber,
        employeeId,
        employeeName,
        itemName: 'СИЗ (Средства индивидуальной защиты)',
        quantity: 1,
        unit: 'комплект',
        urgency: 'Обычная',
        purpose: 'СИЗ',
        notes: JSON.stringify(details), // Сохраняем детали СИЗ в notes
        status: 'pending'
      };
    } else {
      // Для инструментов/оборудования/расходников
      // details это массив позиций [{name, qty}]
      const items = Array.isArray(details) ? details : [details];
      
      // Создаем отдельную заявку для каждой позиции
      const requests = [];
      
      for (const item of items) {
        if (item.name && item.name.trim()) {
          const itemRequestData = {
            requestNumber: `${requestNumber}-${requests.length + 1}`,
            employeeId,
            employeeName,
            itemName: item.name.trim(),
            quantity: item.qty || 1,
            unit: 'шт',
            urgency: 'Обычная',
            purpose: getTypeLabel(type),
            notes: `Тип заявки: ${getTypeLabel(type)}`,
            status: 'pending'
          };
          
          const newRequest = await prisma.request.create({
            data: itemRequestData,
            include: { employee: true }
          });
          
          requests.push(newRequest);
          console.log(`✅ Создана заявка: ${newRequest.requestNumber} - ${newRequest.itemName}`);
        }
      }
      
      // Возвращаем массив созданных заявок
      if (requests.length > 0) {
        res.json({ 
          success: true, 
          count: requests.length,
          requests: requests.map(r => ({
            id: String(r.id),
            requestNumber: r.requestNumber,
            itemName: r.itemName
          }))
        });
        return;
      } else {
        return res.status(400).json({ error: 'Нет валидных позиций для создания заявки' });
      }
    }
    
    // Для СИЗ создаем одну заявку
    const newRequest = await prisma.request.create({
      data: requestData,
      include: { employee: true }
    });
    
    console.log(`✅ Создана заявка: ${newRequest.requestNumber}`);
    
    // Форматируем ответ
    const formatted = {
      id: String(newRequest.id),
      type,
      user: newRequest.employee ? newRequest.employee.name : newRequest.employeeName,
      date: newRequest.createdAt.toISOString(),
      status: 'Новая',
      details: type === 'siz' ? JSON.parse(newRequest.notes || '{}') : parseDetails(newRequest),
      createdAt: newRequest.createdAt.toISOString(),
      requestNumber: newRequest.requestNumber
    };
    
    res.json(formatted);
    
  } catch (error: any) {
    console.error('❌ Ошибка при создании заявки:', error);
    res.status(500).json({ 
      error: 'Ошибка при создании заявки',
      details: error.message 
    });
  }
});

// Вспомогательная функция для получения читаемого названия типа
function getTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    'siz': 'СИЗ',
    'tools': 'Инструменты',
    'equipment': 'Оборудование',
    'consumables': 'Расходники'
  };
  return labels[type] || type;
}

// Обновить статус (Одобрить/Отклонить)
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    // Маппинг статусов фронтенда в статусы БД
    let dbStatus = 'pending';
    if (status === 'Завершена' || status === 'approved') dbStatus = 'approved';
    if (status === 'В работе' || status === 'in_progress') dbStatus = 'in_progress';
    if (status === 'Отклонена' || status === 'rejected') dbStatus = 'rejected';
    
    const updated = await prisma.request.update({
      where: { id: Number(id) },
      data: { status: dbStatus },
      include: { employee: true }
    });
    
    const formatted = {
      id: String(updated.id),
      type: extractTypeFromDetails(updated),
      user: updated.employee ? updated.employee.name : (updated.employeeName || 'Неизвестно'),
      date: updated.createdAt.toISOString(),
      status: mapStatus(updated.status),
      details: parseDetails(updated),
      createdAt: updated.createdAt.toISOString()
    };
    
    res.json(formatted);
  } catch (error) {
    console.error('Error updating request:', error);
    res.status(500).json({ error: 'Ошибка при обновлении статуса заявки' });
  }
});

// Удаление заявки (опционально)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.request.delete({
      where: { id: Number(id) }
    });
    res.sendStatus(204);
  } catch (error) {
    console.error('Error deleting request:', error);
    res.status(500).json({ error: 'Ошибка при удалении заявки' });
  }
});

export default router;
