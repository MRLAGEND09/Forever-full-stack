import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { bakendUrl, currency } from '../App'
import { toast } from 'react-toastify'
import '@fortawesome/fontawesome-free/css/all.min.css'

const Dashboard = ({ token }) => {
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    deliveredOrders: 0,
    cancelledOrders: 0,
    totalRevenue: 0,
    totalSubscribers: 0,
    usersCount: 0,
    conversionRate: 0,
    abandonedCount: 0,
  })
  const [segments, setSegments] = useState({ vip: [], frequent: [], newBuyers: [] })
  const [lowStock, setLowStock] = useState([])

  const fetchStats = async () => {
    if (!token) return
    try {
      const analyticsRes = await axios.get(`${bakendUrl}/api/analytics/dashboard`, { headers: { token } })
      if (analyticsRes.data.success) {
        const data = analyticsRes.data.stats
        setStats(prev => ({
          ...prev,
          totalOrders: data.totalOrders || 0,
          pendingOrders: (data.totalOrders || 0) - (data.deliveredOrders || 0),
          deliveredOrders: data.deliveredOrders || 0,
          cancelledOrders: 0,
          totalRevenue: data.revenue || 0,
          usersCount: data.usersCount || 0,
          conversionRate: data.conversionRate || 0,
          abandonedCount: data.abandonedCount || 0
        }))
      }

      const subRes = await axios.get(`${bakendUrl}/api/subscriber/list`, { headers: { token } })
      if (subRes.data.success) {
        setStats(prev => ({ ...prev, totalSubscribers: subRes.data.subscribers.length }))
      }

      const [segmentsRes, inventoryRes] = await Promise.all([
        axios.get(`${bakendUrl}/api/analytics/segments`, { headers: { token } }),
        axios.get(`${bakendUrl}/api/analytics/inventory-alerts`, { headers: { token } })
      ])

      if (segmentsRes.data.success) {
        setSegments(segmentsRes.data.segments)
      }

      if (inventoryRes.data.success) {
        setLowStock(inventoryRes.data.lowStock || [])
      }
    } catch (error) {
      toast.error(error.message)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [token])

  const cards = [
    { title: 'Total Orders', value: stats.totalOrders, bg: 'bg-blue-50', border: 'border-blue-300', icon: 'fas fa-shopping-bag', iconColor: 'text-blue-400' },
    { title: 'Pending Orders', value: stats.pendingOrders, bg: 'bg-yellow-50', border: 'border-yellow-300', icon: 'fas fa-clock', iconColor: 'text-yellow-400' },
    { title: 'Delivered Orders', value: stats.deliveredOrders, bg: 'bg-green-50', border: 'border-green-300', icon: 'fas fa-truck', iconColor: 'text-green-400' },
    { title: 'Cancelled Orders', value: stats.cancelledOrders, bg: 'bg-red-50', border: 'border-red-300', icon: 'fas fa-times-circle', iconColor: 'text-red-400' },
    { title: 'Total Revenue', value: `${currency}${stats.totalRevenue.toFixed(2)}`, bg: 'bg-purple-50', border: 'border-purple-300', icon: 'fas fa-money-bill-wave', iconColor: 'text-purple-400' },
    { title: 'Subscribers', value: stats.totalSubscribers, bg: 'bg-pink-50', border: 'border-pink-300', icon: 'fas fa-bell', iconColor: 'text-pink-400' },
    { title: 'Users', value: stats.usersCount, bg: 'bg-sky-50', border: 'border-sky-300', icon: 'fas fa-users', iconColor: 'text-sky-500' },
    { title: 'Conversion %', value: `${stats.conversionRate}%`, bg: 'bg-emerald-50', border: 'border-emerald-300', icon: 'fas fa-chart-pie', iconColor: 'text-emerald-500' },
    { title: 'Abandoned Carts', value: stats.abandonedCount, bg: 'bg-amber-50', border: 'border-amber-300', icon: 'fas fa-cart-arrow-down', iconColor: 'text-amber-500' },
  ]

  return (
    <div className='p-6'>
      <h2 className='text-2xl font-semibold mb-6'>
        <i className="fas fa-chart-line mr-2"></i> Dashboard
      </h2>

      <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4'>
        {cards.map((card, index) => (
          <div key={index} className={`${card.bg} border ${card.border} rounded-lg p-4 text-center`}>
            <i className={`${card.icon} ${card.iconColor} text-3xl mb-2`}></i>
            <p className='text-2xl font-bold mt-2'>{card.value}</p>
            <p className='text-sm text-gray-600 mt-1'>{card.title}</p>
          </div>
        ))}
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-4 mt-8'>
        <div className='border rounded-lg p-4 bg-white'>
          <h3 className='font-semibold mb-3'>Customer Segments</h3>
          <p className='text-sm'>VIP: <b>{segments.vip?.length || 0}</b></p>
          <p className='text-sm'>Frequent Buyers: <b>{segments.frequent?.length || 0}</b></p>
          <p className='text-sm'>New Buyers: <b>{segments.newBuyers?.length || 0}</b></p>
        </div>

        <div className='border rounded-lg p-4 bg-white lg:col-span-2'>
          <div className='flex items-center justify-between mb-3'>
            <h3 className='font-semibold'>Inventory Alerts</h3>
            <button
              onClick={async () => {
                await axios.post(`${bakendUrl}/api/analytics/inventory-auto-reorder`, {}, { headers: { token } })
                toast.success('Auto-reorder completed')
                fetchStats()
              }}
              className='text-xs px-3 py-1 border hover:bg-gray-100'
            >
              Auto Reorder
            </button>
          </div>
          {lowStock.length === 0 ? (
            <p className='text-sm text-gray-500'>No low-stock products.</p>
          ) : (
            <div className='space-y-2'>
              {lowStock.slice(0, 6).map((item) => (
                <div key={item._id} className='text-sm flex justify-between border-b pb-1'>
                  <span>{item.name}</span>
                  <span className='text-red-500'>Stock: {item.stock}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Dashboard