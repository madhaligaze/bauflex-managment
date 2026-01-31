import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router: Router = Router();
const prisma = new PrismaClient();

function generateRequestNumber(): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `REQ-${timestamp}-${random}`;
}

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
    
    const formatted = requests.map(req => {
      // ✅ КРИТИЧНО: Правильное определение типа
      let requestType = req.requestType || 'equipment';
      let details = req.detailsJson;
      
      // Если detailsJson null, пытаемся восстановить из других полей
      if (!details) {
        details = {
          itemName: req.itemName,
          quantity: req.quantity,
          unit: req.unit,
          purpose: req.purpose,
          notes: req.notes
        };
      }
      
      return {
        id: String(req.id),
        type: requestType, // ✅ Используем requestType из БД
        user: req.employee ? req.employee.name : (req.employeeName || 'Неизвестно'),
        date: req.createdAt.toISOString(),
        status: mapStatus(req.status),
        details: details,
        createdAt: req.createdAt.toISOString(),
        requestNumber: req.requestNumber
      };
    });
    
    res.json(formatted);
  } catch (error) {
    console.error('❌ Ошибка получения заявок:', error);
    res.status(500).json({ error: 'Ошибка при получении заявок' });
  }
});

// ===== СОЗДАТЬ НОВУЮ ЗАЯВКУ =====
router.post('/', async (req, res) => {
  try {
    const { type, user, details } = req.body;
    
    console.log('📝 Создание заявки:', { type, user, details });
    
    // Поиск сотрудника
    let employeeId = null;
    let employeeName = user;
    
    if (user && user.trim()) {
      const employee = await prisma.employee.findFirst({
        where: { name: { contains: user.trim(), mode: 'insensitive' } }
      });
      if (employee) {
        employeeId = employee.id;
        console.log(`✅ Сотрудник найден: ${employee.name}`);
      }
    }
    
    const requestNumber = generateRequestNumber();
    
    // ===== ОБРАБОТКА СИЗ =====
    if (type === 'siz') {
      // ✅ КРИТИЧНО: Сохраняем detailsJson как объект, НЕ как строку
      const requestData = {
        requestNumber,
        employeeId,
        employeeName,
        requestType: 'siz', // ✅ КРИТИЧНО
        itemName: 'СИЗ (Средства индивидуальной защиты)',
        quantity: 1,
        unit: 'комплект',
        urgency: 'Обычная',
        purpose: 'СИЗ',
        notes: `Заявка на СИЗ для ${user}`,
        status: 'pending',
        detailsJson: details // ✅ Prisma автоматически сериализует в JSONB
      };
      
      const newRequest = await prisma.request.create({
        data: requestData,
        include: { employee: true }
      });
      
      console.log(`✅ СИЗ заявка создана: ${newRequest.requestNumber}`);
      console.log(`✅ Тип сохранен: ${newRequest.requestType}`);
      console.log(`✅ Детали:`, newRequest.detailsJson);
      
      const formatted = {
        id: String(newRequest.id),
        type: 'siz', // ✅ КРИТИЧНО
        user: newRequest.employee ? newRequest.employee.name : newRequest.employeeName,
        date: newRequest.createdAt.toISOString(),
        status: 'Новая',
        details: newRequest.detailsJson, // ✅ Уже объект
        createdAt: newRequest.createdAt.toISOString(),
        requestNumber: newRequest.requestNumber
      };
      
      return res.json(formatted);
    }
    
    // ===== ИНСТРУМЕНТЫ/ОБОРУДОВАНИЕ/РАСХОДНИКИ =====
    const items = Array.isArray(details) ? details : [details];
    const createdRequests = [];
    
    for (const item of items) {
      if (item.name && item.name.trim()) {
        const itemRequestData = {
          requestNumber: `${requestNumber}-${createdRequests.length + 1}`,
          employeeId,
          employeeName,
          requestType: type, // ✅ КРИТИЧНО: Сохраняем правильный тип
          itemName: item.name.trim(),
          quantity: item.qty || 1,
          unit: 'шт',
          urgency: 'Обычная',
          purpose: TYPE_LABELS[type] || type,
          notes: `Тип заявки: ${TYPE_LABELS[type] || type}`,
          status: 'pending',
          detailsJson: item
        };
        
        const newRequest = await prisma.request.create({
          data: itemRequestData,
          include: { employee: true }
        });
        
        createdRequests.push(newRequest);
        console.log(`✅ Создана заявка ${newRequest.requestType}: ${newRequest.itemName}`);
      }
    }
    
    if (createdRequests.length > 0) {
      res.json({ 
        success: true, 
        count: createdRequests.length,
        requests: createdRequests.map(r => ({
          id: String(r.id),
          type: r.requestType, // ✅ Возвращаем правильный тип
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
    console.error('❌ Ошибка обновления:', error);
    res.status(500).json({ error: 'Ошибка обновления' });
  }
});

// ===== ПОЛНОЕ ОБНОВЛЕНИЕ =====
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { user, type, details, status } = req.body;
    
    console.log('📝 Полное обновление заявки:', { id, user, type });
    
    let employeeId = null;
    let employeeName = user;
    
    if (user && user.trim()) {
      const employee = await prisma.employee.findFirst({
        where: { name: { contains: user.trim(), mode: 'insensitive' } }
      });
      if (employee) employeeId = employee.id;
    }
    
    const dbStatus = status ? mapStatusToDB(status) : undefined;
    
    const updateData: any = {
      employeeId,
      employeeName,
      requestType: type, // ✅ КРИТИЧНО: Обновляем тип
      detailsJson: details
    };
    
    if (dbStatus) updateData.status = dbStatus;
    
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
    console.error('❌ Ошибка обновления:', error);
    res.status(500).json({ 
      error: 'Ошибка при обновлении',
      details: error.message
    });
  }
});

// ===== УДАЛИТЬ =====
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.request.delete({ where: { id: Number(id) } });
    console.log(`🗑️ Заявка ${id} удалена`);
    res.sendStatus(204);
  } catch (error) {
    console.error('❌ Ошибка удаления:', error);
    res.status(500).json({ error: 'Ошибка удаления' });
  }
});

export default router;
