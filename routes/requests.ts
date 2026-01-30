import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

// Добавили явный тип : Router
const router: Router = Router();
const prisma = new PrismaClient();

// Получить все заявки (для админки)
router.get('/', async (req, res) => {
  const requests = await prisma.request.findMany({ 
    orderBy: { createdAt: 'desc' } 
  });
  res.json(requests);
});

// Создать новую заявку (из клиентской формы)
router.post('/', async (req, res) => {
  const { type, user, details } = req.body;
  const newRequest = await prisma.request.create({
    data: { type, user, details }
  });
  res.json(newRequest);
});

// Обновить статус (Одобрить/Отклонить)
router.patch('/:id', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const updated = await prisma.request.update({
    where: { id },
    data: { status }
  });
  res.json(updated);
});

export default router;