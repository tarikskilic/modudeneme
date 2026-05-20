/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        background: '#0A0F1E',
        card: '#111827',
        primary: '#3B82F6',
        success: '#10B981',
        warning: '#F59E0B',
        danger: '#EF4444',
        foreground: '#F9FAFB',
        muted: '#6B7280',
        'muted-light': '#9CA3AF',
        border: '#1F2937',
        'border-strong': '#374151',
        'surface-alt': '#0D1321',
      },
    },
  },
  plugins: [],
};
