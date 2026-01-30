import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

// Добавили явный тип : Router
const router: Router = Router();
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'bauflex_ultra_secret_2026';

// --- 1. ВХОД В СИСТЕМУ (С ПРОВЕРКОЙ В БД) ---
router.post('/login', async (req, res) => {
  const { login, password } = req.body;

  try {
    // Ищем пользователя в базе
    const user = await prisma.user.findUnique({ where: { login } });
    
    // Если пользователя нет
    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }

    // Проверяем хеш пароля
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Неверный логин или пароль' });
    }

    // Генерируем токен (нужен для сохранения сессии на фронте)
    const token = jwt.sign(
      { id: user.id, role: user.role }, 
      JWT_SECRET, 
      { expiresIn: '7d' }
    );

    // Возвращаем данные
    res.json({ token, role: user.role, name: user.name });

  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Ошибка сервера при авторизации' });
  }
});

// --- 2. СМЕНА ПАРОЛЯ (ИЗ АДМИНКИ) ---
router.post('/change-password', async (req, res) => {
  const { login, currentPassword, newPassword } = req.body;

  try {
    // Ищем пользователя (по умолчанию admin, если login не передан)
    const targetLogin = login || 'admin';
    const user = await prisma.user.findUnique({ where: { login: targetLogin } });

    if (!user) {
      return res.status(404).json({ message: "Пользователь не найден" });
    }

    // Проверяем старый пароль
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Текущий пароль неверен" });
    }

    // Хешируем новый пароль и сохраняем
    const hashedPass = await bcrypt.hash(newPassword, 10);
    
    await prisma.user.update({
      where: { login: targetLogin },
      data: { password: hashedPass }
    });

    return res.json({ message: "Пароль успешно изменен" });

  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Ошибка при смене пароля" });
  }
});

// --- 3. ЭКСТРЕННЫЙ СБРОС (Reset Request) ---
// Оставляем этот метод, так как он есть в UI (LoginModal)
router.post('/reset-request', async (req, res) => {
  const { login, secretKey, newPassword } = req.body;
  
  try {
    // Проверка мастер-ключа из .env
    if (secretKey === process.env.MASTER_KEY) {
      const user = await prisma.user.findUnique({ where: { login } });
      
      if (!user) return res.status(404).json({ message: "Пользователь не найден" });

      const hashedPass = await bcrypt.hash(newPassword, 10);
      await prisma.user.update({
        where: { login },
        data: { password: hashedPass }
      });
      return res.json({ message: "Доступ восстановлен" });
    }
    
    res.status(403).json({ message: "Ключ восстановления неверен" });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Ошибка при сбросе пароля" });
  }
});

export default router;