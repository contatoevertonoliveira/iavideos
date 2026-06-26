import React from 'react'
import { ConfigProvider } from 'contexts/ConfigContext'
import AdminLayout from 'layouts/AdminLayout'

export default function ThemeAdminLayout() {
  return (
    <ConfigProvider>
      <AdminLayout />
    </ConfigProvider>
  )
}