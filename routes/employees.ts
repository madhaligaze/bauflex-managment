import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

router.get('/', async (req, res) => {
  const employees = await prisma.employee.findMany();
  res.json(employees);
});

router.post('/', async (req, res) => {
  const { fullName, department, position } = req.body;
  const employee = await prisma.employee.create({
    data: { fullName, department, position }
  });
  res.json(employee);
});

router.delete('/:id', async (req, res) => {
  await prisma.employee.delete({ where: { id: req.params.id } });
  res.sendStatus(204);
});

export default router;