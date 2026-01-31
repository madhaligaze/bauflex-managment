import * as XLSX from 'xlsx';
import { RequestEntry } from '@/entities/request/model/store';
import { formatDate } from './dateFormatter';

// Ленивая загрузка PDF
let pdfMake: any = null;
let pdfFonts: any = null;

const initializePdfMake = async () => {
  if (!pdfMake) {
    const pdfMakeModule = await import('pdfmake/build/pdfmake');
    const pdfFontsModule = await import('pdfmake/build/vfs_fonts');
    pdfMake = pdfMakeModule.default;
    pdfFonts = pdfFontsModule.default;
    pdfMake.vfs = pdfFonts.pdfMake.vfs;
  }
  return pdfMake;
};

const TYPE_LABELS: Record<string, string> = {
  siz: 'СИЗ',
  tools: 'Инструменты',
  equipment: 'Оборудование',
  consumables: 'Расходники'
};

const STATUS_LABELS: Record<string, string> = {
  'Новая': 'Новая',
  'В работе': 'В работе',
  'Завершена': 'Завершена'
};

// ✅ КРИТИЧНАЯ ФУНКЦИЯ: Безопасный парсинг данных
function safeParseDetails(details: any): any {
  // Если это строка - парсим JSON
  if (typeof details === 'string') {
    try {
      return JSON.parse(details);
    } catch (e) {
      console.warn('Не удалось распарсить JSON:', details);
      return {};
    }
  }
  // Если уже объект - возвращаем как есть
  return details || {};
}

// ✅ КРИТИЧНАЯ ФУНКЦИЯ: Форматирование деталей для отображения
const formatDetails = (req: RequestEntry): string => {
  const details = safeParseDetails(req.details);
  
  // СИЗ - форматируем в читаемый вид
  if (req.type === 'siz' && details) {
    const parts: string[] = [];
    
    if (details.height) parts.push(`Рост: ${details.height} см`);
    if (details.clothingSize) parts.push(`Размер одежды: ${details.clothingSize}`);
    if (details.clothingSeason) parts.push(`Сезон одежды: ${details.clothingSeason}`);
    if (details.shoeSize) parts.push(`Размер обуви: ${details.shoeSize}`);
    if (details.shoeSeason) parts.push(`Сезон обуви: ${details.shoeSeason}`);
    
    return parts.length > 0 ? parts.join(', ') : 'Нет данных';
  }
  
  // Массив позиций (инструменты/оборудование)
  if (Array.isArray(details)) {
    return details
      .map((item: any) => `${item.name} × ${item.qty} шт.`)
      .join(', ');
  }
  
  // Объект с полями
  if (typeof details === 'object') {
    const parts: string[] = [];
    
    if (details.itemName) parts.push(details.itemName);
    if (details.quantity) parts.push(`Кол-во: ${details.quantity} ${details.unit || 'шт.'}`);
    if (details.purpose) parts.push(`Назначение: ${details.purpose}`);
    if (details.notes) parts.push(`Примечание: ${details.notes}`);
    
    return parts.length > 0 ? parts.join(', ') : 'Нет данных';
  }
  
  return 'Нет данных';
};

// ✅ КРИТИЧНАЯ ФУНКЦИЯ: Извлечение размеров СИЗ для Excel
const extractSizDetails = (req: RequestEntry) => {
  if (req.type !== 'siz') {
    return {
      height: '-',
      clothingSize: '-',
      clothingSeason: '-',
      shoeSize: '-',
      shoeSeason: '-'
    };
  }
  
  const details = safeParseDetails(req.details);
  
  return {
    height: details.height || '-',
    clothingSize: details.clothingSize || '-',
    clothingSeason: details.clothingSeason || '-',
    shoeSize: details.shoeSize || '-',
    shoeSeason: details.shoeSeason || '-'
  };
};

// Генерация уникального имени файла
function generateUniqueFilename(prefix: string, extension: string): string {
  const now = new Date();
  const day = now.getDate();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = now.getFullYear();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  
  return `${prefix}_${day}_${month}_${year}_${hours}_${minutes}_${seconds}.${extension}`;
}

// ===== ЭКСПОРТ В EXCEL =====
export const exportToExcel = (requests: RequestEntry[]) => {
  if (!requests || requests.length === 0) {
    alert('Нет данных для экспорта');
    return;
  }

  console.log('📊 Экспорт в Excel, заявок:', requests.length);

  const sortedData = [...requests].sort((a, b) => {
    const dateA = new Date(a.createdAt || a.date).getTime();
    const dateB = new Date(b.createdAt || b.date).getTime();
    return dateB - dateA;
  });

  const excelData = sortedData.map((req, index) => {
    const sizDetails = extractSizDetails(req);
    
    // ✅ КРИТИЧНО: Правильное определение типа
    const typeLabel = TYPE_LABELS[req.type] || req.type;
    
    console.log(`Заявка ${index + 1}: Тип=${req.type}, Label=${typeLabel}`);
    
    return {
      '№': index + 1,
      'Сотрудник': req.user,
      'Тип заявки': typeLabel, // ✅ Используем правильный маппинг
      'Статус': STATUS_LABELS[req.status || 'Новая'] || req.status || 'Новая',
      'Дата создания': formatDate(req.createdAt || req.date),
      'Подробности': formatDetails(req),
      'Рост': sizDetails.height,
      'Размер одежды': sizDetails.clothingSize,
      'Сезон одежды': sizDetails.clothingSeason,
      'Размер обуви': sizDetails.shoeSize,
      'Сезон обуви': sizDetails.shoeSeason
    };
  });

  const ws = XLSX.utils.json_to_sheet(excelData);
  ws['!cols'] = [
    { wch: 5 }, { wch: 25 }, { wch: 15 }, { wch: 12 }, { wch: 20 },
    { wch: 50 }, { wch: 10 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Заявки');

  // ✅ КРИТИЧНО: Статистика по правильным типам
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

  console.log('📊 Статистика по типам:', {
    siz: requests.filter(r => r.type === 'siz').length,
    tools: requests.filter(r => r.type === 'tools').length,
    equipment: requests.filter(r => r.type === 'equipment').length,
    consumables: requests.filter(r => r.type === 'consumables').length
  });

  const wsStats = XLSX.utils.aoa_to_sheet(stats);
  wsStats['!cols'] = [{ wch: 30 }, { wch: 15 }];
  XLSX.utils.book_append_sheet(wb, wsStats, 'Статистика');

  const filename = generateUniqueFilename('BAUFLEX_Заявки', 'xlsx');
  console.log('✅ Excel файл сгенерирован:', filename);
  XLSX.writeFile(wb, filename);
};

// ===== ЭКСПОРТ В PDF =====
export const exportToPDF = async (requests: RequestEntry[]) => {
  if (!requests || requests.length === 0) {
    alert('Нет данных для экспорта');
    return;
  }

  console.log('📄 Экспорт в PDF, заявок:', requests.length);

  const pdf = await initializePdfMake();

  const sortedData = [...requests].sort((a, b) => {
    const dateA = new Date(a.createdAt || a.date).getTime();
    const dateB = new Date(b.createdAt || b.date).getTime();
    return dateB - dateA;
  });

  const byEmployee: Record<string, RequestEntry[]> = {};
  sortedData.forEach(req => {
    if (!byEmployee[req.user]) {
      byEmployee[req.user] = [];
    }
    byEmployee[req.user].push(req);
  });

  const content: any[] = [
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

  Object.entries(byEmployee).forEach(([employee, reqs], index) => {
    content.push({
      text: `Сотрудник: ${employee}`,
      style: 'employeeHeader',
      margin: [0, index === 0 ? 0 : 15, 0, 5]
    });

    const tableBody: any[] = [
      [
        { text: '№', style: 'tableHeader', fillColor: '#dc2626' },
        { text: 'Тип заявки', style: 'tableHeader', fillColor: '#dc2626' },
        { text: 'Статус', style: 'tableHeader', fillColor: '#dc2626' },
        { text: 'Дата создания', style: 'tableHeader', fillColor: '#dc2626' },
        { text: 'Подробности', style: 'tableHeader', fillColor: '#dc2626' }
      ]
    ];

    reqs.forEach((req, idx) => {
      const statusColor = 
        req.status === 'Новая' ? '#fee2e2' : 
        req.status === 'В работе' ? '#fef3c7' : 
        '#d1fae5';

      // ✅ КРИТИЧНО: Правильный тип заявки
      const typeLabel = TYPE_LABELS[req.type] || req.type;
      
      console.log(`PDF заявка ${idx + 1}: Тип=${req.type}, Label=${typeLabel}`);

      tableBody.push([
        { text: (idx + 1).toString(), style: 'tableCell' },
        { text: typeLabel, style: 'tableCell' }, // ✅ Правильный маппинг
        { text: req.status || 'Новая', style: 'tableCell', fillColor: statusColor },
        { text: formatDate(req.createdAt || req.date), style: 'tableCell' },
        { text: formatDetails(req), style: 'tableCellDetails' } // ✅ Читаемый формат
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

  content.push({ text: '', pageBreak: 'before' });
  content.push({
    text: 'СВОДНАЯ СТАТИСТИКА',
    style: 'header',
    alignment: 'center',
    margin: [0, 20, 0, 20]
  });

  // ✅ КРИТИЧНО: Статистика по правильным типам
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

  const docDefinition: any = {
    pageSize: 'A4',
    pageOrientation: 'landscape',
    pageMargins: [40, 60, 40, 60],
    content: content,
    styles: {
      header: { fontSize: 20, bold: true, color: '#dc2626' },
      subheader: { fontSize: 14, bold: true },
      dateInfo: { fontSize: 9, italics: true, color: '#6b7280' },
      employeeHeader: { fontSize: 12, bold: true, color: '#dc2626' },
      tableHeader: { fontSize: 9, bold: true, color: 'white', alignment: 'center' },
      tableCell: { fontSize: 8, alignment: 'center' },
      tableCellDetails: { fontSize: 8, alignment: 'left' }
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

  const filename = generateUniqueFilename('BAUFLEX_Отчет', 'pdf');
  console.log('✅ PDF файл сгенерирован:', filename);
  pdf.createPdf(docDefinition).download(filename);
};

export const exportToPDF_pdfmake = exportToPDF;
