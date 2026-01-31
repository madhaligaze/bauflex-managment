import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { RequestEntry } from '@/entities/request/model/store';
import { formatDate, formatDateOnly } from './dateFormatter';

// Хелпер для превращения JSON в читаемый текст
const formatDetails = (req: RequestEntry) => {
  if (req.type === 'siz') {
    const d = req.details;
    return `Рост: ${d.height || '—'}, Одежда: ${d.clothingSize || '—'} (${d.clothingSeason || '—'}), Обувь: ${d.shoeSize || '—'} (${d.shoeSeason || '—'})`;
  }
  
  if (Array.isArray(req.details)) {
    return req.details.map((item: any) => `${item.name} × ${item.qty} шт.`).join(', ');
  }
  
  return '—';
};

// Маппинг типов
const TYPE_LABELS: Record<string, string> = {
  siz: 'СИЗ',
  tools: 'Инструменты',
  equipment: 'Оборудование',
  consumables: 'Расходники'
};

// --- ЭКСПОРТ В EXCEL (Улучшенная версия) ---
export const exportToExcel = (requests: RequestEntry[]) => {
  if (!requests || requests.length === 0) {
    alert('Нет данных для экспорта');
    return;
  }

  // 1. Сортируем: сначала по дате (новые сверху), затем по сотруднику и типу
  const sortedData = [...requests].sort((a, b) => {
    // Сначала по дате (новые первыми)
    const dateA = new Date(a.createdAt || a.date).getTime();
    const dateB = new Date(b.createdAt || b.date).getTime();
    if (dateB !== dateA) return dateB - dateA;
    
    // Затем по сотруднику
    const userCompare = a.user.localeCompare(b.user, 'ru');
    if (userCompare !== 0) return userCompare;
    
    // Затем по типу
    return a.type.localeCompare(b.type);
  });

  // 2. Группируем по сотрудникам для второго листа
  const byEmployee: Record<string, RequestEntry[]> = {};
  sortedData.forEach(req => {
    if (!byEmployee[req.user]) {
      byEmployee[req.user] = [];
    }
    byEmployee[req.user].push(req);
  });

  // 3. Формируем данные для основного листа (Общий реестр)
  const mainSheetData = sortedData.map((req, index) => ({
    '№': index + 1,
    'Сотрудник': req.user || '—',
    'Тип заявки': TYPE_LABELS[req.type] || req.type,
    'Статус': req.status || 'Новая',
    'Дата создания': formatDate(req.createdAt || req.date),
    'Детали заявки': formatDetails(req)
  }));

  const mainWorksheet = XLSX.utils.json_to_sheet(mainSheetData);

  // Настройка ширины колонок
  mainWorksheet['!cols'] = [
    { wch: 5 },   // №
    { wch: 30 },  // Сотрудник
    { wch: 18 },  // Тип
    { wch: 15 },  // Статус
    { wch: 20 },  // Дата
    { wch: 80 }   // Детали (широкая)
  ];

  // 4. Лист "По сотрудникам" - группировка
  const employeeSheetData: any[] = [];
  Object.entries(byEmployee).forEach(([employee, reqs]) => {
    // Заголовок сотрудника
    employeeSheetData.push({
      'Сотрудник': employee,
      'Количество заявок': reqs.length,
      'Последняя заявка': formatDateOnly(reqs[0].createdAt || reqs[0].date),
      'Детали': ''
    });
    
    // Его заявки
    reqs.forEach((req, idx) => {
      employeeSheetData.push({
        'Сотрудник': `  ${idx + 1}. ${TYPE_LABELS[req.type] || req.type}`,
        'Количество заявок': '',
        'Последняя заявка': formatDate(req.createdAt || req.date),
        'Детали': formatDetails(req)
      });
    });
    
    // Пустая строка после каждого сотрудника
    employeeSheetData.push({
      'Сотрудник': '',
      'Количество заявок': '',
      'Последняя заявка': '',
      'Детали': ''
    });
  });

  const employeeWorksheet = XLSX.utils.json_to_sheet(employeeSheetData);
  employeeWorksheet['!cols'] = [
    { wch: 35 },  // Сотрудник
    { wch: 18 },  // Количество
    { wch: 20 },  // Дата
    { wch: 80 }   // Детали
  ];

  // 5. Сводная таблица (Статистика)
  const stats: Record<string, any> = {
    'ОБЩАЯ СТАТИСТИКА': '',
    'Всего заявок': requests.length,
    'Уникальных сотрудников': Object.keys(byEmployee).length,
    '': '',
    'ПО СТАТУСАМ': '',
    'Новые': requests.filter(r => r.status === 'Новая').length,
    'В работе': requests.filter(r => r.status === 'В работе').length,
    'Завершены': requests.filter(r => r.status === 'Завершена').length,
    ' ': '',
    'ПО КАТЕГОРИЯМ': '',
    'СИЗ': requests.filter(r => r.type === 'siz').length,
    'Инструменты': requests.filter(r => r.type === 'tools').length,
    'Оборудование': requests.filter(r => r.type === 'equipment').length,
    'Расходники': requests.filter(r => r.type === 'consumables').length,
    '  ': '',
    'Дата формирования отчета': formatDate(new Date().toISOString())
  };

  const statsSheetData = Object.entries(stats).map(([name, count]) => ({
    'Показатель': name,
    'Значение': count
  }));

  const statsSheet = XLSX.utils.json_to_sheet(statsSheetData);
  statsSheet['!cols'] = [{ wch: 40 }, { wch: 20 }];

  // 6. Создаем книгу и добавляем все листы
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, mainWorksheet, "Общий реестр");
  XLSX.utils.book_append_sheet(workbook, employeeWorksheet, "По сотрудникам");
  XLSX.utils.book_append_sheet(workbook, statsSheet, "Статистика");

  // Сохраняем с читаемым именем
  const today = new Date();
  const filename = `BAUFLEX_Отчет_${today.getDate()}_${String(today.getMonth() + 1).padStart(2, '0')}_${today.getFullYear()}.xlsx`;
  
  XLSX.writeFile(workbook, filename);
};

// --- ЭКСПОРТ В PDF (С ПОДДЕРЖКОЙ КИРИЛЛИЦЫ) ---
export const exportToPDF = (requests: RequestEntry[]) => {
  if (!requests || requests.length === 0) {
    alert('Нет данных для экспорта');
    return;
  }

  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  // Настройка для кириллицы - используем встроенные шрифты
  // Для полной поддержки кириллицы нужно подключить кастомный шрифт
  // но базово работает с helvetica
  
  // Заголовок
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('BAUFLEX MANAGEMENT', 148, 15, { align: 'center' });
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.text('Реестр заявок', 148, 23, { align: 'center' });
  
  // Информация о документе
  doc.setFontSize(9);
  doc.setFont('helvetica', 'italic');
  const dateStr = formatDate(new Date().toISOString());
  doc.text(`Сформировано: ${dateStr}`, 148, 29, { align: 'center' });

  // Сортируем данные
  const sortedData = [...requests].sort((a, b) => {
    const dateA = new Date(a.createdAt || a.date).getTime();
    const dateB = new Date(b.createdAt || b.date).getTime();
    return dateB - dateA;
  });

  // Группируем по сотрудникам для отображения
  const byEmployee: Record<string, RequestEntry[]> = {};
  sortedData.forEach(req => {
    if (!byEmployee[req.user]) {
      byEmployee[req.user] = [];
    }
    byEmployee[req.user].push(req);
  });

  let startY = 35;

  // Формируем таблицу по сотрудникам
  Object.entries(byEmployee).forEach(([employee, reqs], empIndex) => {
    // Проверяем, нужна ли новая страница
    if (startY > 170) {
      doc.addPage();
      startY = 20;
    }

    // Заголовок сотрудника
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(220, 38, 38); // Красный цвет BAUFLEX
    doc.text(`Сотрудник: ${employee}`, 14, startY);
    doc.setTextColor(0, 0, 0);
    
    startY += 2;

    // Таблица заявок этого сотрудника
    const tableRows = reqs.map((req, idx) => [
      `${idx + 1}`,
      TYPE_LABELS[req.type] || req.type,
      req.status || 'Новая',
      formatDate(req.createdAt || req.date),
      formatDetails(req)
    ]);

    autoTable(doc, {
      startY: startY,
      head: [['№', 'Тип заявки', 'Статус', 'Дата создания', 'Подробности']],
      body: tableRows,
      theme: 'grid',
      styles: { 
        fontSize: 8,
        cellPadding: 2,
        font: 'helvetica',
        lineColor: [200, 200, 200],
        lineWidth: 0.1
      },
      headStyles: { 
        fillColor: [220, 38, 38],
        textColor: [255, 255, 255],
        fontSize: 9,
        fontStyle: 'bold',
        halign: 'center'
      },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 30 },
        2: { cellWidth: 25, halign: 'center' },
        3: { cellWidth: 35, halign: 'center' },
        4: { cellWidth: 'auto' }
      },
      margin: { left: 14, right: 14 },
      didDrawPage: (data) => {
        // Номера страниц
        const pageCount = doc.getNumberOfPages();
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(150, 150, 150);
        doc.text(
          `Страница ${doc.getCurrentPageInfo().pageNumber} из ${pageCount}`,
          148,
          200,
          { align: 'center' }
        );
      }
    });

    startY = (doc as any).lastAutoTable.finalY + 8;
  });

  // Последняя страница - сводка
  doc.addPage();
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(220, 38, 38);
  doc.text('СВОДНАЯ СТАТИСТИКА', 148, 20, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');

  const stats = [
    ['Всего заявок:', requests.length],
    ['Уникальных сотрудников:', Object.keys(byEmployee).length],
    ['', ''],
    ['По статусам:', ''],
    ['  Новые:', requests.filter(r => r.status === 'Новая').length],
    ['  В работе:', requests.filter(r => r.status === 'В работе').length],
    ['  Завершены:', requests.filter(r => r.status === 'Завершена').length],
    ['', ''],
    ['По категориям:', ''],
    ['  СИЗ:', requests.filter(r => r.type === 'siz').length],
    ['  Инструменты:', requests.filter(r => r.type === 'tools').length],
    ['  Оборудование:', requests.filter(r => r.type === 'equipment').length],
    ['  Расходники:', requests.filter(r => r.type === 'consumables').length]
  ];

  autoTable(doc, {
    startY: 30,
    head: [['Показатель', 'Значение']],
    body: stats,
    theme: 'striped',
    styles: { 
      fontSize: 10,
      cellPadding: 3,
      font: 'helvetica'
    },
    headStyles: { 
      fillColor: [220, 38, 38],
      fontSize: 11,
      fontStyle: 'bold'
    },
    columnStyles: {
      0: { cellWidth: 120 },
      1: { cellWidth: 60, halign: 'center', fontStyle: 'bold' }
    },
    margin: { left: 50, right: 50 }
  });

  // Сохраняем
  const today = new Date();
  const filename = `BAUFLEX_Отчет_${today.getDate()}_${String(today.getMonth() + 1).padStart(2, '0')}_${today.getFullYear()}.pdf`;
  doc.save(filename);
};
