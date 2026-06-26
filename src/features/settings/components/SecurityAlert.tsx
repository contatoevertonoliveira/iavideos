import React from 'react'

type Props = { message: string; severity?: 'info' | 'warning' | 'error' }

export default function SecurityAlert({ message, severity = 'warning' }: Props) {
  const color = severity === 'error' ? 'bg-red-600' : severity === 'info' ? 'bg-blue-600' : 'bg-yellow-600'
  return (
    <div className={`rounded px-3 py-2 text-sm ${color}`}>{message}</div>
  )
}