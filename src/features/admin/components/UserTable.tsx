import React from 'react'
import RoleBadge from './RoleBadge'

type User = { id: number; email: string; role: 'superAdmin' | 'moderator' | 'user' | 'viewer'; last_login_at?: string | null }
type Props = {
  users: User[]
  onChangeRole?: (id: number, role: 'superAdmin' | 'moderator' | 'user' | 'viewer') => void
}

export default function UserTable({ users, onChangeRole }: Props) {
  return (
    <table className="table table-sm align-middle w-100 text-white">
      <thead>
        <tr className="text-white/70">
          <th>ID</th>
          <th>Email</th>
          <th>Role</th>
          <th>Último login</th>
          {onChangeRole ? <th>Ações</th> : null}
        </tr>
      </thead>
      <tbody>
        {users.map((u) => (
          <tr key={u.id} className="border-top border-white/10">
            <td>{u.id}</td>
            <td>{u.email}</td>
            <td><RoleBadge role={u.role} /></td>
            <td>{u.last_login_at ? new Date(u.last_login_at).toLocaleString() : '—'}</td>
            {onChangeRole ? (
              <td>
                <div className="d-flex gap-2 align-items-center">
                  <select
                    className="form-select form-select-sm bg-transparent text-white"
                    defaultValue={u.role}
                    onChange={(e) => onChangeRole?.(u.id, e.target.value as 'superAdmin' | 'moderator' | 'user' | 'viewer')}
                  >
                    <option value="superAdmin">superAdmin</option>
                    <option value="moderator">moderator</option>
                    <option value="user">user</option>
                  </select>
                </div>
              </td>
            ) : null}
          </tr>
        ))}
      </tbody>
    </table>
  )
}