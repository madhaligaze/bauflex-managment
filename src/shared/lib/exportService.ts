import * as XLSX from 'xlsx';
import { RequestEntry } from '@/entities/request/model/store';
import { formatDate } from './dateFormatter';

// Импорты для PDF с правильной типизацией
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';

// Настройка шрифтов для поддержки кириллицы
(pdfMake as any).vfs = pdfFonts.pdfMake.vfs;

// Добавляем поддержку кириллических шрифтов
(pdfMake as any).fonts = {
  Roboto: {
    normal: 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.66/fonts/Roboto/Roboto-Regular.ttf',
    bold: 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.66/fonts/Roboto/Roboto-Medium.ttf',
    italics: 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.66/fonts/Roboto/Roboto-Italic.ttf',
    bolditalics: 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.66/fonts/Roboto/Roboto-MediumItalic.ttf'
  }
};

// Маппинг типов заявок
const TYPE_LABELS: Record<string, string> = {
  siz: 'СИЗ',
  tools: 'Инструменты',
  equipment: 'Оборудование',
  consumables: 'Расходники'
};

// Маппинг статусов
const STATUS_LABELS: Record<string, string> = {
  'Новая': 'Новая',
  'В работе': 'В работе',
  'Завершена': 'Завершена'
};

// ============================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ============================================

// Форматирование деталей для отображения
const formatDetails = (req: RequestEntry): string => {
  if (req.type === 'siz' && req.details) {
    const d = req.details as any;
    const parts: string[] = [];
    
    if (d.height) parts.push(`Рост: ${d.height}`);
    if (d.clothingSize) parts.push(`Размер одежды: ${d.clothingSize}`);
    if (d.clothingSeason) parts.push(`Сезон одежды: ${d.clothingSeason}`);
    if (d.shoeSize) parts.push(`Размер обуви: ${d.shoeSize}`);
    if (d.shoeSeason) parts.push(`Сезон обуви: ${d.shoeSeason}`);
    
    return parts.join(', ');
  }
  
  if (Array.isArray(req.details)) {
    return req.details.map((item: any) => `${item.name} × ${item.qty} шт.`).join(', ');
  }
  
  if (typeof req.details === 'object' && req.details !== null) {
    const d = req.details as any;
    const parts: string[] = [];
    
    if (d.itemName) parts.push(d.itemName);
    if (d.quantity) parts.push(`Кол-во: ${d.quantity} ${d.unit || 'шт.'}`);
    if (d.purpose) parts.push(`Назначение: ${d.purpose}`);
    if (d.notes) parts.push(`Примечание: ${d.notes}`);
    
    return parts.join(', ');
  }
  
  return 'Нет данных';
};

// Извлечение размеров для СИЗ
const extractSizDetails = (req: RequestEntry) => {
  if (req.type === 'siz' && req.details) {
    const d = req.details as any;
    return {
      height: d.height || '-',
      clothingSize: d.clothingSize || '-',
      clothingSeason: d.clothingSeason || '-',
      shoeSize: d.shoeSize || '-',
      shoeSeason: d.shoeSeason || '-'
    };
  }
  return {
    height: '-',
    clothingSize: '-',
    clothingSeason: '-',
    shoeSize: '-',
    shoeSeason: '-'
  };
};

// ============================================
// ЭКСПОРТ В EXCEL
// ============================================

export const exportToExcel = (requests: RequestEntry[]) => {
  if (!requests || requests.length === 0) {
    alert('Нет данных для экспорта');
    return;
  }

  // Сортируем по дате (новые первые)
  const sortedData = [...requests].sort((a, b) => {
    const dateA = new Date(a.createdAt || a.date).getTime();
    const dateB = new Date(b.createdAt || b.date).getTime();
    return dateB - dateA;
  });

  // Формируем данные для Excel с учетом размеров СИЗ
  const excelData = sortedData.map((req, index) => {
    const sizDetails = extractSizDetails(req);
    
    return {
      '№': index + 1,
      'Сотрудник': req.user,
      'Тип заявки': TYPE_LABELS[req.type] || req.type,
      'Статус': STATUS_LABELS[req.status || 'Новая'] || req.status || 'Новая',
      'Дата создания': formatDate(req.createdAt || req.date),
      'Подробности': formatDetails(req),
      // Добавляем колонки с размерами для СИЗ
      'Рост': sizDetails.height,
      'Размер одежды': sizDetails.clothingSize,
      'Сезон одежды': sizDetails.clothingSeason,
      'Размер обуви': sizDetails.shoeSize,
      'Сезон обуви': sizDetails.shoeSeason
    };
  });

  // Создаем worksheet
  const ws = XLSX.utils.json_to_sheet(excelData);

  // Настраиваем ширину колонок
  const colWidths = [
    { wch: 5 },  // №
    { wch: 25 }, // Сотрудник
    { wch: 15 }, // Тип заявки
    { wch: 12 }, // Статус
    { wch: 20 }, // Дата создания
    { wch: 50 }, // Подробности
    { wch: 10 }, // Рост
    { wch: 15 }, // Размер одежды
    { wch: 15 }, // Сезон одежды
    { wch: 15 }, // Размер обуви
    { wch: 15 }  // Сезон обуви
  ];
  ws['!cols'] = colWidths;

  // Создаем workbook
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Заявки');

  // Добавляем лист статистики
  const stats = [
    ['Показатель', 'Значение'],
    ['Всего заявок', requests.length],
    ['', ''],
    ['По статусам:', ''],
    ['Новые', requests.filter(r => r.status === 'Новая' || !r.status).length],
    ['В работе', requests.filter(r => r.status === 'В работе').length],
    ['Завершены', requests.filter(r => r.status === 'Завершена').length],
    ['', ''],
    ['По категориям:', ''],
    ['СИЗ', requests.filter(r => r.type === 'siz').length],
    ['Инструменты', requests.filter(r => r.type === 'tools').length],
    ['Оборудование', requests.filter(r => r.type === 'equipment').length],
    ['Расходники', requests.filter(r => r.type === 'consumables').length]
  ];

  const wsStats = XLSX.utils.aoa_to_sheet(stats);
  wsStats['!cols'] = [{ wch: 30 }, { wch: 15 }];
  XLSX.utils.book_append_sheet(wb, wsStats, 'Статистика');

  // Формируем имя файла
  const today = new Date();
  const filename = `BAUFLEX_Заявки_${today.getDate()}_${String(today.getMonth() + 1).padStart(2, '0')}_${today.getFullYear()}.xlsx`;

  // Скачиваем файл
  XLSX.writeFile(wb, filename);
};

// ============================================
// ЭКСПОРТ В PDF
// ============================================

export const exportToPDF = (requests: RequestEntry[]) => {
  if (!requests || requests.length === 0) {
    alert('Нет данных для экспорта');
    return;
  }

  // Сортируем данные
  const sortedData = [...requests].sort((a, b) => {
    const dateA = new Date(a.createdAt || a.date).getTime();
    const dateB = new Date(b.createdAt || b.date).getTime();
    return dateB - dateA;
  });

  // Группируем по сотрудникам
  const byEmployee: Record<string, RequestEntry[]> = {};
  sortedData.forEach(req => {
    if (!byEmployee[req.user]) {
      byEmployee[req.user] = [];
    }
    byEmployee[req.user].push(req);
  });

  // Формируем контент документа
  const content: any[] = [
    // Заголовок
    {
      text: 'BAUFLEX MANAGEMENT',
      style: 'header',
      alignment: 'center',
      margin: [0, 0, 0, 5]
    },
    {
      text: 'Реестр заявок',
      style: 'subheader',
      alignment: 'center',
      margin: [0, 0, 0, 2]
    },
    {
      text: `Сформировано: ${formatDate(new Date().toISOString())}`,
      style: 'dateInfo',
      alignment: 'center',
      margin: [0, 0, 0, 20]
    }
  ];

  // Добавляем таблицы для каждого сотрудника
  Object.entries(byEmployee).forEach(([employee, reqs], index) => {
    // Заголовок сотрудника
    content.push({
      text: `Сотрудник: ${employee}`,
      style: 'employeeHeader',
      margin: [0, index === 0 ? 0 : 15, 0, 5]
    });

    // Таблица заявок
    const tableBody: any[] = [
      // Заголовки
      [
        { text: '№', style: 'tableHeader', fillColor: '#dc2626' },
        { text: 'Тип заявки', style: 'tableHeader', fillColor: '#dc2626' },
        { text: 'Статус', style: 'tableHeader', fillColor: '#dc2626' },
        { text: 'Дата создания', style: 'tableHeader', fillColor: '#dc2626' },
        { text: 'Подробности', style: 'tableHeader', fillColor: '#dc2626' }
      ]
    ];

    // Строки с данными
    reqs.forEach((req, idx) => {
      const statusColor = 
        req.status === 'Новая' ? '#fee2e2' : 
        req.status === 'В работе' ? '#fef3c7' : 
        '#d1fae5';

      tableBody.push([
        { text: (idx + 1).toString(), style: 'tableCell' },
        { text: TYPE_LABELS[req.type] || req.type, style: 'tableCell' },
        { text: req.status || 'Новая', style: 'tableCell', fillColor: statusColor },
        { text: formatDate(req.createdAt || req.date), style: 'tableCell' },
        { text: formatDetails(req), style: 'tableCellDetails' }
      ]);
    });

    content.push({
      table: {
        headerRows: 1,
        widths: [25, 80, 60, 80, '*'],
        body: tableBody
      },
      layout: {
        hLineWidth: () => 0.5,
        vLineWidth: () => 0.5,
        hLineColor: () => '#e5e7eb',
        vLineColor: () => '#e5e7eb'
      }
    });
  });

  // Добавляем страницу со статистикой
  content.push({ text: '', pageBreak: 'before' });
  
  content.push({
    text: 'СВОДНАЯ СТАТИСТИКА',
    style: 'header',
    alignment: 'center',
    margin: [0, 20, 0, 20]
  });

  const statsBody: any[] = [
    [
      { text: 'Показатель', style: 'tableHeader', fillColor: '#dc2626' }, 
      { text: 'Значение', style: 'tableHeader', fillColor: '#dc2626' }
    ],
    ['Всего заявок:', requests.length.toString()],
    ['Уникальных сотрудников:', Object.keys(byEmployee).length.toString()],
    [{ text: '', colSpan: 2 }, ''],
    [{ text: 'По статусам:', bold: true, colSpan: 2 }, ''],
    ['  Новые:', requests.filter(r => r.status === 'Новая' || !r.status).length.toString()],
    ['  В работе:', requests.filter(r => r.status === 'В работе').length.toString()],
    ['  Завершены:', requests.filter(r => r.status === 'Завершена').length.toString()],
    [{ text: '', colSpan: 2 }, ''],
    [{ text: 'По категориям:', bold: true, colSpan: 2 }, ''],
    ['  СИЗ:', requests.filter(r => r.type === 'siz').length.toString()],
    ['  Инструменты:', requests.filter(r => r.type === 'tools').length.toString()],
    ['  Оборудование:', requests.filter(r => r.type === 'equipment').length.toString()],
    ['  Расходники:', requests.filter(r => r.type === 'consumables').length.toString()]
  ];

  content.push({
    table: {
      headerRows: 1,
      widths: [300, 100],
      body: statsBody
    },
    layout: 'lightHorizontalLines'
  });

  // Определение документа
  const docDefinition: any = {
    pageSize: 'A4',
    pageOrientation: 'landscape',
    pageMargins: [40, 60, 40, 60],
    content: content,
    styles: {
      header: {
        fontSize: 20,
        bold: true,
        color: '#dc2626'
      },
      subheader: {
        fontSize: 14,
        bold: true
      },
      dateInfo: {
        fontSize: 9,
        italics: true,
        color: '#6b7280'
      },
      employeeHeader: {
        fontSize: 12,
        bold: true,
        color: '#dc2626'
      },
      tableHeader: {
        fontSize: 9,
        bold: true,
        color: 'white',
        alignment: 'center'
      },
      tableCell: {
        fontSize: 8,
        alignment: 'center'
      },
      tableCellDetails: {
        fontSize: 8,
        alignment: 'left'
      }
    },
    defaultStyle: {
      font: 'Roboto'
    },
    footer: function(currentPage: number, pageCount: number) {
      return {
        text: `Страница ${currentPage} из ${pageCount}`,
        alignment: 'center',
        fontSize: 8,
        color: '#9ca3af',
        margin: [0, 10, 0, 0]
      };
    }
  };

  // Генерируем и скачиваем PDF
  const today = new Date();
  const filename = `BAUFLEX_Отчет_${today.getDate()}_${String(today.getMonth() + 1).padStart(2, '0')}_${today.getFullYear()}.pdf`;
  
  pdfMake.createPdf(docDefinition).download(filename);
};

// Экспортируем также старую функцию для обратной совместимости
export const exportToPDF_pdfmake = exportToPDF;
