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

// Маппинг типов для читаемости
const TYPE_LABELS: Record<string, string> = {
  'siz': 'СИЗ',
  'tools': 'Инструменты',
  'equipment': 'Оборудование',
  'consumables': 'Расходники'
};

// Маппинг статусов БД → Фронтенд
function mapStatus(status: string): 'Новая' | 'В работе' | 'Завершена' {
  if (status === 'approved' || status === 'completed') return 'Завершена';
  if (status === 'in_progress' || status === 'processing') return 'В работе';
  return 'Новая';
}

// Маппинг статусов Фронтенд → БД
function mapStatusToDB(status: string): string {
  if (status === 'Завершена') return 'completed';
  if (status === 'В работе') return 'in_progress';
  return 'pending';
}

// ===== ПОЛУЧИТЬ ВСЕ ЗАЯВКИ =====
router.get('/', async (req, res) => {
  try {
    const requests = await prisma.request.findMany({ 
      orderBy: { createdAt: 'desc' },
      include: { employee: true }
    });
    
    const formatted = requests.map(req => ({
      id: String(req.id),
      type: req.requestType || 'equipment',
      user: req.employee ? req.employee.name : (req.employeeName || 'Неизвестно'),
      date: req.createdAt.toISOString(),
      status: mapStatus(req.status),
      details: req.detailsJson || {
        itemName: req.itemName,
        quantity: req.quantity,
        unit: req.unit,
        purpose: req.purpose,
        notes: req.notes
      },
      createdAt: req.createdAt.toISOString(),
      requestNumber: req.requestNumber
    }));
    
    res.json(formatted);
  } catch (error) {
    console.error('Error fetching requests:', error);
    res.status(500).json({ error: 'Ошибка при получении заявок' });
  }
});

// ===== СОЗДАТЬ НОВУЮ ЗАЯВКУ =====
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
          name: { contains: user.trim(), mode: 'insensitive' }
        }
      });
      
      if (employee) {
        employeeId = employee.id;
        console.log(`✅ Найден сотрудник: ${employee.name} (ID: ${employee.id})`);
      } else {
        console.log(`⚠️ Сотрудник "${user}" не найден, сохраняем как текст`);
      }
    }
    
    const requestNumber = generateRequestNumber();
    
    // ===== ОБРАБОТКА СИЗ =====
    if (type === 'siz') {
      const requestData = {
        requestNumber,
        employeeId,
        employeeName,
        requestType: 'siz',
        itemName: 'СИЗ (Средства индивидуальной защиты)',
        quantity: 1,
        unit: 'комплект',
        urgency: 'Обычная',
        purpose: 'СИЗ',
        notes: `Заявка на СИЗ для ${user}`,
        status: 'pending',
        detailsJson: details // ✅ Сохраняем полные детали СИЗ
      };
      
      const newRequest = await prisma.request.create({
        data: requestData,
        include: { employee: true }
      });
      
      console.log(`✅ Создана заявка СИЗ: ${newRequest.requestNumber}`);
      console.log(`✅ Сохраненные детали:`, newRequest.detailsJson);
      
      const formatted = {
        id: String(newRequest.id),
        type: 'siz',
        user: newRequest.employee ? newRequest.employee.name : newRequest.employeeName,
        date: newRequest.createdAt.toISOString(),
        status: 'Новая',
        details: newRequest.detailsJson,
        createdAt: newRequest.createdAt.toISOString(),
        requestNumber: newRequest.requestNumber
      };
      
      return res.json(formatted);
    }
    
    // ===== ОБРАБОТКА ИНСТРУМЕНТОВ/ОБОРУДОВАНИЯ/РАСХОДНИКОВ =====
    const items = Array.isArray(details) ? details : [details];
    const createdRequests = [];
    
    for (const item of items) {
      if (item.name && item.name.trim()) {
        const itemRequestData = {
          requestNumber: `${requestNumber}-${createdRequests.length + 1}`,
          employeeId,
          employeeName,
          requestType: type,
          itemName: item.name.trim(),
          quantity: item.qty || 1,
          unit: 'шт',
          urgency: 'Обычная',
          purpose: TYPE_LABELS[type] || type,
          notes: `Тип заявки: ${TYPE_LABELS[type] || type}`,
          status: 'pending',
          detailsJson: item // Сохраняем детали позиции
        };
        
        const newRequest = await prisma.request.create({
          data: itemRequestData,
          include: { employee: true }
        });
        
        createdRequests.push(newRequest);
        console.log(`✅ Создана заявка: ${newRequest.requestNumber} - ${newRequest.itemName}`);
      }
    }
    
    if (createdRequests.length > 0) {
      res.json({ 
        success: true, 
        count: createdRequests.length,
        requests: createdRequests.map(r => ({
          id: String(r.id),
          requestNumber: r.requestNumber,
          itemName: r.itemName
        }))
      });
    } else {
      res.status(400).json({ error: 'Нет валидных позиций' });
    }
    
  } catch (error: any) {
    console.error('❌ Ошибка создания заявки:', error);
    res.status(500).json({ 
      error: 'Ошибка при создании заявки',
      details: error.message 
    });
  }
});

// ===== ОБНОВИТЬ СТАТУС =====
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const dbStatus = mapStatusToDB(status);
    
    const updated = await prisma.request.update({
      where: { id: Number(id) },
      data: { status: dbStatus },
      include: { employee: true }
    });
    
    const formatted = {
      id: String(updated.id),
      type: updated.requestType || 'equipment',
      user: updated.employee ? updated.employee.name : updated.employeeName,
      date: updated.createdAt.toISOString(),
      status: mapStatus(updated.status),
      details: updated.detailsJson || {
        itemName: updated.itemName,
        quantity: updated.quantity
      },
      createdAt: updated.createdAt.toISOString(),
      requestNumber: updated.requestNumber
    };
    
    res.json(formatted);
  } catch (error) {
    console.error('Error updating request:', error);
    res.status(500).json({ error: 'Ошибка обновления' });
  }
});

// ===== ОБНОВИТЬ ЗАЯВКУ ПОЛНОСТЬЮ (НОВЫЙ ENDPOINT) =====
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { user, type, details, status } = req.body;
    
    console.log('📝 Обновление заявки:', { id, user, type, details, status });
    
    // Ищем сотрудника если имя изменилось
    let employeeId = null;
    let employeeName = user;
    
    if (user && user.trim()) {
      const employee = await prisma.employee.findFirst({
        where: { name: { contains: user.trim(), mode: 'insensitive' } }
      });
      if (employee) employeeId = employee.id;
    }
    
    const dbStatus = status ? mapStatusToDB(status) : undefined;
    
    // Формируем данные для обновления
    const updateData: any = {
      employeeId,
      employeeName,
      requestType: type,
      detailsJson: details
    };
    
    if (dbStatus) updateData.status = dbStatus;
    
    // Для СИЗ обновляем itemName
    if (type === 'siz') {
      updateData.itemName = 'СИЗ (Средства индивидуальной защиты)';
      updateData.quantity = 1;
      updateData.unit = 'комплект';
    }
    
    const updated = await prisma.request.update({
      where: { id: Number(id) },
      data: updateData,
      include: { employee: true }
    });
    
    const formatted = {
      id: String(updated.id),
      type: updated.requestType || 'equipment',
      user: updated.employee ? updated.employee.name : updated.employeeName,
      date: updated.createdAt.toISOString(),
      status: mapStatus(updated.status),
      details: updated.detailsJson,
      createdAt: updated.createdAt.toISOString(),
      requestNumber: updated.requestNumber
    };
    
    console.log('✅ Заявка обновлена:', formatted);
    res.json(formatted);
    
  } catch (error: any) {
    console.error('❌ Ошибка обновления заявки:', error);
    res.status(500).json({ 
      error: 'Ошибка при обновлении заявки',
      details: error.message
    });
  }
});

// ===== УДАЛИТЬ ЗАЯВКУ =====
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.request.delete({
      where: { id: Number(id) }
    });
    console.log(`🗑️ Заявка ${id} удалена`);
    res.sendStatus(204);
  } catch (error) {
    console.error('Error deleting request:', error);
    res.status(500).json({ error: 'Ошибка удаления' });
  }
});

export default router;
