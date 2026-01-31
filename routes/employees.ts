import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

// Добавили явный тип : Router
const router: Router = Router();
const prisma = new PrismaClient();

router.get('/', async (req, res) => {
  const employees = await prisma.employee.findMany();
  // Приводим к формату что ожидает фронт
  const formatted = employees.map(emp => ({
    id: String(emp.id),
    fullName: emp.name,
    department: emp.department || '',
    position: emp.position || '',
    email: emp.email,
    phone: emp.phone,
    clothingSize: emp.clothingSize,
    shoeSize: emp.shoeSize,
    height: emp.height
  }));
  res.json(formatted);
});

router.post('/', async (req, res) => {
  const { fullName, department, position, email, phone, clothingSize, shoeSize, height } = req.body;
  const employee = await prisma.employee.create({
    data: { 
      name: fullName,
      department, 
      position,
      email,
      phone,
      clothingSize,
      shoeSize,
      height
    }
  });
  res.json(employee);
});

// PATCH - обновление существующего сотрудника
router.patch('/:id', async (req, res) => {
  const { id } = req.params;
  const { fullName, department, position, email, phone, clothingSize, shoeSize, height } = req.body;
  
  try {
    const updated = await prisma.employee.update({
      where: { id: Number(id) },
      data: {
        name: fullName,
        department,
        position,
        email,
        phone,
        clothingSize,
        shoeSize,
        height
      }
    });
    res.json(updated);
  } catch (e) {
    res.status(404).json({ error: 'Сотрудник не найден' });
  }
});

router.delete('/:id', async (req, res) => {
  await prisma.employee.delete({ where: { id: Number(req.params.id) } });
  res.sendStatus(204);
});

export default router;