import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { RequestEntry } from '@/entities/request/model/store';

// Хелпер для превращения JSON в читаемый текст
const formatDetails = (req: RequestEntry) => {
  if (req.type === 'siz') {
    const d = req.details;
    return `Рост: ${d.height}, Одежда: ${d.clothingSize} (${d.clothingSeason}), Обувь: ${d.shoeSize} (${d.shoeSeason})`;
  }
  
  if (Array.isArray(req.details)) {
    return req.details.map((item: any) => `${item.name} (x${item.qty})`).join(', ');
  }
  
  return '—';
};

// --- ЭКСПОРТ В EXCEL (Сортировка + 2 листа) ---
export const exportToExcel = (requests: RequestEntry[]) => {
  // 1. Сортируем: сначала новые, затем группируем по типу
  const sortedData = [...requests].sort((a, b) => {
    // Сначала по статусу (Новая выше)
    if (a.status === 'Новая' && b.status !== 'Новая') return -1;
    if (a.status !== 'Новая' && b.status === 'Новая') return 1;
    // Затем по типу
    return a.type.localeCompare(b.type);
  });

  // 2. Формируем данные для основного листа
  const mainSheetData = sortedData.map(req => ({
    'ID': req.id.slice(0, 8),
    'Сотрудник': req.user,
    'Категория': req.type.toUpperCase(),
    'Статус': req.status,
    'Дата': req.date || '—',
    'Состав заявки': formatDetails(req)
  }));

  const worksheet = XLSX.utils.json_to_sheet(mainSheetData);

  // 3. Сводная таблица (статистика для бухгалтерии)
  const stats = {
    'Всего заявок': requests.length,
    'Новые (в обработке)': requests.filter(r => r.status === 'Новая').length,
    '--- По категориям ---': '',
    'СИЗ': requests.filter(r => r.type === 'siz').length,
    'Инструменты': requests.filter(r => r.type === 'tools').length,
    'Оборудование': requests.filter(r => r.type === 'equipment').length,
    'Расходники': requests.filter(r => r.type === 'consumables').length,
  };

  const statsSheetData = Object.entries(stats).map(([name, count]) => ({
    'Показатель': name,
    'Значение': count
  }));

  const statsSheet = XLSX.utils.json_to_sheet(statsSheetData);

  // 4. Создаем книгу и добавляем листы
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Реестр заявок");
  XLSX.utils.book_append_sheet(workbook, statsSheet, "Сводный отчет");

  // Настройка ширины колонок для основного листа
  worksheet['!cols'] = [
    { wch: 10 }, // ID
    { wch: 25 }, // Сотрудник
    { wch: 15 }, // Категория
    { wch: 12 }, // Статус
    { wch: 12 }, // Дата
    { wch: 70 }  // Состав (широкая)
  ];

  // Настройка ширины для статистики
  statsSheet['!cols'] = [{ wch: 30 }, { wch: 10 }];

  XLSX.writeFile(workbook, `BAUFLEX_Report_${new Date().toLocaleDateString()}.xlsx`);
};

// --- ЭКСПОРТ В PDF (Оставляем как было, с обновленным форматтером) ---
export const exportToPDF = (data: RequestEntry[]) => {
  const doc = new jsPDF('landscape'); // Ландшафтная ориентация для широких таблиц
  
  // Добавляем поддержку кириллицы (стандартный шрифт может не поддерживать, 
  // но в базовом примере используем дефолт. Для продакшена лучше подключить ttf шрифт)
  doc.setFontSize(18);
  doc.text("BAUFLEX management - Реестр заявок", 14, 20);
  
  const tableRows = data.map(req => [
    req.user,
    req.type.toUpperCase(),
    req.status,
    formatDetails(req)
  ]);

  autoTable(doc, {
    startY: 30,
    head: [['Сотрудник', 'Тип', 'Статус', 'Подробности заказа']],
    body: tableRows,
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [220, 38, 38] }, // Красный BAUFLEX
    columnStyles: {
      3: { cellWidth: 100 } // Широкая колонка для деталей
    }
  });

  doc.save(`Bauflex_Report_${Date.now()}.pdf`);
};