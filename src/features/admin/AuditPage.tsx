import React from 'react'
import SectionCard from '@/components/ui/SectionCard'

export default function AuditPage() {
  return (
    <div className="p-4 md:p-6 space-y-6">
      <SectionCard title="Auditoria" subtitle="Logs globais">
        <div className="text-white/80 text-sm">Em construção: visualização e exportação (com RBAC).</div>
      </SectionCard>
    </div>
  )
}