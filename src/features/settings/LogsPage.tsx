import React, { useEffect, useState } from 'react'
import { useSettings } from './hooks/useSettings'
import LogsTable from './components/LogsTable'
import { GuardedAction } from '@/features/admin/components/GuardedAction'

export default function LogsPage() {
  const { logs, loadLogs, exportLogs } = useSettings()
  const [level, setLevel] = useState('')
  const [source, setSource] = useState('')
  useEffect(() => { loadLogs() }, [loadLogs])

  const filtered = logs.filter(l => (!level || l.level === level) && (!source || l.source === source))

  return (
    <div className="p-4 md:p-6">
      <h1 className="text-xl font-semibold mb-4">Logs & Diagnóstico</h1>
      <div className="flex gap-2 mb-3">
        <select className="bg-transparent border border-white/20 rounded px-2 py-1" value={level} onChange={(e)=>setLevel(e.target.value)}>
          <option value="">Todos níveis</option>
          <option value="info">Info</option>
          <option value="warning">Warning</option>
          <option value="error">Error</option>
        </select>
        <select className="bg-transparent border border-white/20 rounded px-2 py-1" value={source} onChange={(e)=>setSource(e.target.value)}>
          <option value="">Todas origens</option>
          <option value="upload">Upload</option>
          <option value="ai">AI</option>
          <option value="mcp">MCP</option>
        </select>
        <div className="flex gap-2 ml-auto">
          <GuardedAction action="export" subject="logs" fallback={<span className="text-white/50 text-xs" title="Requer superAdmin">Exportação restrita</span>}>
            <>
              <button className="px-3 py-1 rounded bg-blue-600 hover:bg-blue-700 text-sm" onClick={()=>exportLogs('json')}>Export JSON</button>
              <button className="px-3 py-1 rounded bg-blue-600 hover:bg-blue-700 text-sm" onClick={()=>exportLogs('csv')}>Export CSV</button>
            </>
          </GuardedAction>
        </div>
      </div>
      <LogsTable logs={filtered} />
    </div>
  )
}