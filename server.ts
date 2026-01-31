import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import authRoutes from './routes/auth.js'; 
import requestRoutes from './routes/requests.js'; 
import employeeRoutes from './routes/employees.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

// --- 1. API РОУТЫ (Всегда ставим ПЕРЕД статикой) ---
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

// --- 2. СТАТИКА ---
// Так как после билда server.js лежит в /dist рядом с index.html
const distPath = __dirname; 

// Раздаем статические файлы (css, js, картинки)
app.use(express.static(distPath));

// --- 3. ОБРАБОТКА CLIENT-SIDE ROUTING ---
// Важно: этот роут должен быть самым последним!
app.get('*', (req, res) => {
  // Если запрос пришел на /api, который не обработан выше - отдаем 404
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ message: 'API endpoint not found' });
  }
  
  // Для всего остального (маршруты React) отдаем index.html
  const indexPath = path.join(distPath, 'index.html');
  res.sendFile(indexPath);
});

// --- АДМИН ПРИ ПЕРВОМ ЗАПУСКЕ ---
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
    console.error('Error creating admin (Check DATABASE_URL):', e);
  }
};

// Railway прокидывает PORT автоматически, слушаем на 0.0.0.0
const PORT = Number(process.env.PORT) || 5000;

app.listen(PORT, '0.0.0.0', async () => {
  await setupAdmin();
  console.log(`🚀 Server started on port ${PORT}`);
});