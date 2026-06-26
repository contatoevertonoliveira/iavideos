import { api } from '@/lib/api'

export function useAdmin() {
  async function seedUsers() {
    return (await api.post('/admin/users/seed')).data
  }
  async function listUsers() {
    return (await api.get('/admin/users')).data as any[]
  }
  async function setUserRole(id: number, role: 'superAdmin' | 'moderator' | 'user' | 'viewer') {
    return (await api.patch(`/admin/users/${id}/role`, { role })).data
  }
  async function createDeleteRequest(resource: string, resource_id: number, reason?: string) {
    return (await api.post('/admin/requests', { type: 'delete', resource, resource_id, reason })).data
  }
  async function listRequests(status: 'pending' | 'approved' | 'rejected' = 'pending') {
    return (await api.get('/admin/requests', { params: { status } })).data as any[]
  }
  async function approveRequest(id: number) {
    return (await api.post(`/admin/requests/${id}/approve`)).data
  }
  async function rejectRequest(id: number) {
    return (await api.post(`/admin/requests/${id}/reject`)).data
  }
  return { seedUsers, listUsers, setUserRole, createDeleteRequest, listRequests, approveRequest, rejectRequest }
}