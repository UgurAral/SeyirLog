/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: '#3B82F6',
        success: '#22C55E',
        warning: '#F59E0B',
        danger: '#EF4444',
        surface: '#1E293B',
        background: '#0F172A',
        muted: '#64748B',
        text: '#F1F5F9',
        textMuted: '#94A3B8',
        border: '#334155',
      },
    },
  },
};
