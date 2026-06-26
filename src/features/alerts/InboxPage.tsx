import React from 'react'
import NotificationList from './components/NotificationList'
import { useNotificationsSSE, useNotificationsStore } from './useNotifications'
import { useParams } from 'react-router-dom'

export default function InboxPage() {
  useNotificationsSSE()
  const { id } = useParams()
  const { fetchAll } = useNotificationsStore()
  React.useEffect(() => { fetchAll().catch(() => {}) }, [fetchAll])
  // A seleção por :id é tratada dentro da NotificationList abrindo o modal via filtro
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-white">Inbox</h1>
        <div className="text-white/60 text-sm">Centro de alertas e notificações</div>
      </div>
      <NotificationList />
    </div>
  )
}