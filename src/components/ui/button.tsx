import React from 'react'
import { cn } from '@/lib/utils'

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'default' | 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
}

export function Button({ className, variant = 'default', size = 'md', ...props }: Props) {
  const base = 'inline-flex items-center justify-center rounded-cine transition-colors transition-transform duration-200 ease-cine focus:outline-none focus:ring-2 ring-cine-primary active:scale-[0.98]'
  const sizes = {
    sm: 'h-8 px-2.5 text-sm',
    md: 'h-9 px-3 text-sm',
    lg: 'h-10 px-4 text-base',
  }
  const variants = {
    // Mantém compatibilidade legada para escuro
    default: 'bg-slate-900/60 text-white hover:bg-slate-900/80',
    // Primário do tema (claro/escuro) com alto contraste e alternância de cor no hover
    primary: 'bg-[var(--cine-primary)] text-white hover:bg-[var(--cine-secondary)] active:bg-[var(--cine-primary)]',
    // Secundário do tema: superfície com borda
    secondary: 'bg-cine-surface text-cine border border-cine hover-cine',
    // Ghost com cor primária do tema
    ghost: 'bg-transparent text-[var(--cine-primary)] hover:opacity-80',
  }
  return <button className={cn(base, sizes[size], variants[variant], className)} {...props} />
}