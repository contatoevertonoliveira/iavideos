import React from 'react'
import SectionCard from '@/components/ui/SectionCard'

export default function AdminHome() {
  return (
    <div className="p-4 md:p-6 space-y-6">
      <SectionCard title="Admin" subtitle="Visão geral (totais e atalhos)">
        <div className="text-white/80 text-sm">Em construção: cards com contadores globais.</div>
      </SectionCard>
    </div>
  )
}