import React from 'react'
import { TrendingUp, ShoppingCart, Gift, Wallet } from 'lucide-react'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts'

const monthlyData = [
  { month: 'Jan', sales: 21356 },
  { month: 'Feb', sales: 19840 },
  { month: 'Mar', sales: 20560 },
  { month: 'Apr', sales: 21000 },
  { month: 'May', sales: 22040 },
  { month: 'Jun', sales: 21560 },
  { month: 'Jul', sales: 22540 },
  { month: 'Aug', sales: 23010 },
  { month: 'Sep', sales: 22120 },
  { month: 'Oct', sales: 22780 },
  { month: 'Nov', sales: 23510 },
  { month: 'Dec', sales: 24320 },
]

const satisfactionData = [
  { name: 'Extremamente Satisfeitos', value: 35.5, color: '#38b000' },
  { name: 'Satisfeitos', value: 26.9, color: '#70e000' },
  { name: 'Pouco Satisfeitos', value: 21.5, color: '#f4a261' },
  { name: 'Insatisfeitos', value: 16.1, color: '#e76f51' },
]

export default function ThemeDashboardSales() {
  return (
    <div className="container-fluid">
      {/* Header */}
      <div className="row mb-4 align-items-center">
        <div className="col">
          <h3 className="mb-1">Dashboard</h3>
          <p className="text-muted mb-0">Visão geral de vendas e desempenho</p>
        </div>
      </div>

      {/* Top Stats */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card">
            <div className="card-body d-flex align-items-center justify-content-between">
              <div>
                <p className="text-muted mb-1">Total Sales</p>
                <h4 className="mb-0">$21,356.46</h4>
              </div>
              <div className="p-2 rounded bg-primary-subtle text-primary">
                <TrendingUp size={22} />
              </div>
            </div>
          </div>
        </div>
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card">
            <div className="card-body d-flex align-items-center justify-content-between">
              <div>
                <p className="text-muted mb-1">Total Orders</p>
                <h4 className="mb-0">15,830</h4>
              </div>
              <div className="p-2 rounded bg-info-subtle text-info">
                <ShoppingCart size={22} />
              </div>
            </div>
          </div>
        </div>
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card">
            <div className="card-body d-flex align-items-center justify-content-between">
              <div>
                <p className="text-muted mb-1">Average Price</p>
                <h4 className="mb-0">$6,780</h4>
              </div>
              <div className="p-2 rounded bg-warning-subtle text-warning">
                <Wallet size={22} />
              </div>
            </div>
          </div>
        </div>
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card">
            <div className="card-body d-flex align-items-center justify-content-between">
              <div>
                <p className="text-muted mb-1">Product Sold</p>
                <h4 className="mb-0">6,784</h4>
              </div>
              <div className="p-2 rounded bg-success-subtle text-success">
                <Gift size={22} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="row g-3">
        <div className="col-12 col-xl-8">
          <div className="card h-100">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Department wise monthly sales report</h5>
              <button className="btn btn-sm btn-outline-secondary">Download CSV</button>
            </div>
            <div className="card-body" style={{ height: 320 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(v: any) => `$${Number(v).toLocaleString()}`} />
                  <Line type="monotone" dataKey="sales" stroke="#3f51b5" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        <div className="col-12 col-xl-4">
          <div className="card h-100">
            <div className="card-header">
              <h5 className="mb-0">Customer Satisfaction</h5>
            </div>
            <div className="card-body d-flex align-items-center justify-content-center" style={{ height: 320 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={satisfactionData} dataKey="value" nameKey="name" innerRadius={70} outerRadius={110}>
                    {satisfactionData.map((entry, idx) => (
                      <Cell key={`cell-${idx}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: any) => `${v}%`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="card-footer">
              <div className="d-flex flex-wrap gap-3">
                {satisfactionData.map((s) => (
                  <div key={s.name} className="d-flex align-items-center gap-2">
                    <span className="d-inline-block rounded" style={{ width: 10, height: 10, background: s.color }} />
                    <span className="text-muted small">{s.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="row g-3 mt-1">
        <div className="col-12 col-xl-8">
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="mb-0">New Products</h5>
              {/* Removed Buy Now per request */}
            </div>
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table mb-0 align-middle">
                  <thead className="table-light">
                    <tr>
                      <th>Product Name</th>
                      <th>Status</th>
                      <th>Price</th>
                      <th className="text-end">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { name: 'HeadPhone', status: 'Pending', price: '$10' },
                      { name: 'Iphone 6', status: 'Cancel', price: '$10' },
                      { name: 'Jacket', status: 'Success', price: '$10' },
                      { name: 'Sofa', status: 'Cancel', price: '$10' },
                    ].map((p, idx) => (
                      <tr key={idx}>
                        <td>{p.name}</td>
                        <td>
                          <span className={`badge ${p.status === 'Success' ? 'bg-success' : p.status === 'Pending' ? 'bg-warning' : 'bg-secondary'}`}>{p.status}</span>
                        </td>
                        <td>{p.price}</td>
                        <td className="text-end">
                          <button className="btn btn-sm btn-outline-secondary">View</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
        <div className="col-12 col-xl-4">
          <div className="card h-100">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between mb-2">
                <h6 className="mb-0">Total Profit</h6>
                <span className="badge bg-primary">$1,783</span>
              </div>
              <p className="text-muted small mb-3">Resumo rápido de lucro e desempenho recente.</p>
              <ul className="list-group list-group-flush">
                {[
                  '15 novos pedidos confirmados',
                  '2 produtos com estoque baixo',
                  'Reembolso processado para 3 pedidos',
                  'Campanha de remarketing iniciada',
                ].map((f, idx) => (
                  <li key={idx} className="list-group-item px-0 d-flex align-items-center justify-content-between">
                    <span>{f}</span>
                    <span className="text-muted small">agora</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}