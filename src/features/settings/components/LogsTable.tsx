import React from 'react'
import type { LogItem } from '../hooks/useSettings'

type Props = { logs: LogItem[] }

export default function LogsTable({ logs }: Props) {
  return (
    <div className="overflow-auto border border-white/10 rounded">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="bg-white/5">
            <th className="text-left px-3 py-2">Timestamp</th>
            <th className="text-left px-3 py-2">Level</th>
            <th className="text-left px-3 py-2">Source</th>
            <th className="text-left px-3 py-2">Message</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((l, idx) => (
            <tr key={idx} className="border-t border-white/10">
              <td className="px-3 py-2 whitespace-nowrap">{new Date(l.timestamp).toLocaleString()}</td>
              <td className="px-3 py-2 capitalize">{l.level}</td>
              <td className="px-3 py-2">{l.source}</td>
              <td className="px-3 py-2">{l.message}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}