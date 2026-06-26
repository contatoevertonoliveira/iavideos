import React from 'react';
import { useTheme } from '@/providers/ThemeProvider';

export default function ThemeToggle() {
  const { theme, toggle } = useTheme();
  return (
    <button
      onClick={toggle}
      className="gradient-cine text-white rounded-cine px-4 py-2 shadow-cine focus:outline-none focus:ring-2 ring-cine-primary"
      aria-label="Alternar tema"
      title="Alternar tema"
    >
      {theme === 'dark' ? '☀️ Claro' : '🌙 Escuro'}
    </button>
  );
}