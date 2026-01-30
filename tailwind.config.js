/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Добавляем палитру для строгого, дорогого интерфейса
        premium: {
          bg: '#F8F9FA',      // Светлый молочный фон
          surface: '#FFFFFF', // Чистые белые карточки
          text: '#1A1A1B',    // Глубокий графит для текста
          muted: '#666666',   // Серый для второстепенных подписей
          accent: '#1A1A1B',  // Темный акцент (вместо ярких цветов)
          border: '#E5E5E5',  // Едва заметные разделители
        }
      },
      fontFamily: {
        // Оставляем Manrope как основной современный шрифт
        sans: ['Manrope', 'sans-serif'],
      },
      boxShadow: {
        // Уходим от "пузырчатых" теней к мягким и глубоким
        'premium-sm': '0 2px 4px rgba(0,0,0,0.02)',
        'premium-md': '0 12px 24px -10px rgba(0,0,0,0.05)',
        'premium-lg': '0 20px 40px -15px rgba(0, 0, 0, 0.05)',
      },
      borderRadius: {
        // Переходим к более строгим формам
        'premium': '12px', 
      }
    },
  },
  plugins: [],
}