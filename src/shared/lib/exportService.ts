import * as XLSX from 'xlsx';
import { RequestEntry } from '@/entities/request/model/store';
import { formatDate } from './dateFormatter';

// Импорты для PDF - ленивая загрузка
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

// Форматирование деталей
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

// Извлечение размеров СИЗ
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

// ✅ УНИКАЛЬНОЕ ИМЯ ФАЙЛА
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

// ЭКСПОРТ В EXCEL
export const exportToExcel = (requests: RequestEntry[]) => {
  if (!requests || requests.length === 0) {
    alert('Нет данных для экспорта');
    return;
  }

  const sortedData = [...requests].sort((a, b) => {
    const dateA = new Date(a.createdAt || a.date).getTime();
    const dateB = new Date(b.createdAt || b.date).getTime();
    return dateB - dateA;
  });

  const excelData = sortedData.map((req, index) => {
    const sizDetails = extractSizDetails(req);
    
    return {
      '№': index + 1,
      'Сотрудник': req.user,
      'Тип заявки': TYPE_LABELS[req.type] || req.type,
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

  // ✅ УНИКАЛЬНОЕ ИМЯ
  const filename = generateUniqueFilename('BAUFLEX_Заявки', 'xlsx');
  XLSX.writeFile(wb, filename);
};

// ЭКСПОРТ В PDF
export const exportToPDF = async (requests: RequestEntry[]) => {
  if (!requests || requests.length === 0) {
    alert('Нет данных для экспорта');
    return;
  }

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

  // ✅ УНИКАЛЬНОЕ ИМЯ
  const filename = generateUniqueFilename('BAUFLEX_Отчет', 'pdf');
  pdf.createPdf(docDefinition).download(filename);
};

export const exportToPDF_pdfmake = exportToPDF;
