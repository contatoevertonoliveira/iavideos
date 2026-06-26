import React from 'react'

export default function RoleBadge({ role }: { role: 'superAdmin' | 'moderator' | 'user' | 'viewer' }) {
  const color = role === 'superAdmin' ? 'bg-green-600' : role === 'moderator' ? 'bg-yellow-600' : 'bg-gray-600'
  return <span className={`badge ${color} text-white`}>{role}</span>
}