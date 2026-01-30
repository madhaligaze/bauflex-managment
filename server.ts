import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs'; // Добавили импорт для хеширования
import authRoutes from './routes/auth'; 
import requestRoutes from './routes/requests'; 
import employeeRoutes from './routes/employees';

const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

// Подключаем роуты
app.use('/api/requests', requestRoutes); 
app.use('/api/employees', employeeRoutes);
app.use('/api/auth', authRoutes);

app.get('/api/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', message: 'Bauflex Backend Online' });
  } catch (e: any) {
    res.status(500).json({ status: 'error', message: e.message });
  }
});

// --- ФУНКЦИЯ СОЗДАНИЯ ПЕРВОГО АДМИНА ---
const setupAdmin = async () => {
  try {
    const exists = await prisma.user.findUnique({ where: { login: 'admin' } });
    if (!exists) {
      console.log('Creating initial admin user...');
      const hashed = await bcrypt.hash('admin123', 10);
      await prisma.user.create({
        data: { 
          login: 'admin', 
          password: hashed, 
          name: 'Администратор',
          role: 'ADMIN' 
        }
      });
      console.log('✅ Admin created: admin / admin123');
    }
  } catch (e) {
    console.error('Error creating admin:', e);
  }
};

// Запускаем сервер и создаем админа
app.listen(5000, async () => {
  await setupAdmin(); // Запуск проверки при старте
  console.log('🚀 Server started on http://localhost:5000');
});