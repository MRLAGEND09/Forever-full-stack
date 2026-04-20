import React, { useEffect, useState, useMemo } from 'react'
import axios from 'axios'
import { bakendUrl, currency } from '../App'
import { toast } from 'react-toastify'
import { useNavigate } from 'react-router-dom'

// 🔥 React Icons
import {
  FaChartPie,
  FaSearch,
  FaShoppingBag,
  FaMoneyBillWave,
  FaUser,
  FaEnvelope,
  FaPhone,
  FaCalendarAlt,
  FaBoxOpen,
  FaEye
} from 'react-icons/fa'

import {
  MdPendingActions
} from 'react-icons/md'

import {
  BsTruck,
  BsCheckCircleFill,
  BsXCircleFill
} from 'react-icons/bs'

import { FiClock } from 'react-icons/fi'

const OrderOverview = ({ token }) => {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const navigate = useNavigate()

  // 🔥 Debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchTerm])

  const fetchAllOrders = async () => {
    try {
      const res = await axios.post(`${bakendUrl}/api/order/list`, {}, { headers: { token } })
      if (res.data.success) {
        setOrders(res.data.orders.sort((a, b) => new Date(b.date) - new Date(a.date)))
      }
    } catch (error) {
      toast.error(error.message)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchAllOrders()
  }, [token])

  const getAvatarUrl = (order) => {
    const avatar = order?.customerProfile?.avatar || ''
    if (!avatar) return '/default-avatar.png'
    if (/^https?:\/\//i.test(avatar)) return avatar
    return `${bakendUrl}${avatar}`
  }

  // 🔥 Status Icons
  const getStatusIcon = (status) => {
    switch (status) {
      case 'Pending': return <FiClock className="text-yellow-500" />
      case 'Order Accepted': return <BsCheckCircleFill className="text-blue-500" />
      case 'Packing': return <FaBoxOpen className="text-purple-500" />
      case 'Shipped': return <BsTruck className="text-indigo-500" />
      case 'Out for delivery': return <BsTruck className="text-orange-500" />
      case 'Delivered': return <BsCheckCircleFill className="text-green-500" />
      case 'Cancelled': return <BsXCircleFill className="text-red-500" />
      default: return <FiClock />
    }
  }

  const getJourneyProgress = (status) => {
    const journey = ['Pending', 'Order Accepted', 'Shipped', 'Out for delivery', 'Delivered']
    const index = journey.indexOf(status)
    return index >= 0 ? ((index + 1) / journey.length) * 100 : 0
  }

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const matchesStatus = filterStatus === 'all' || order.status === filterStatus
      const matchesSearch =
        order._id.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        order.address?.name?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        order.address?.email?.toLowerCase().includes(debouncedSearch.toLowerCase())

      return matchesStatus && matchesSearch
    })
  }, [orders, filterStatus, debouncedSearch])

  const statusStats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'Pending').length,
    delivered: orders.filter(o => o.status === 'Delivered').length,
    totalRevenue: orders.reduce((sum, o) => sum + (o.amount || 0), 0)
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* 🔥 Header */}
      <div className="bg-white p-6 shadow-sm sticky top-0 z-20">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <FaChartPie className="text-blue-600" />
          Order Overview
        </h1>

        {/* 🔍 Search */}
        <div className="relative mt-4">
          <FaSearch className="absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Search orders..."
            className="w-full pl-10 pr-4 py-2 border rounded-lg"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="p-6">

        {/* 🔥 Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">

          <div className="bg-white p-4 rounded-lg shadow flex items-center gap-3">
            <FaShoppingBag className="text-blue-500 text-2xl" />
            <div>
              <p>Total Orders</p>
              <p className="font-bold">{statusStats.total}</p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow flex items-center gap-3">
            <MdPendingActions className="text-yellow-500 text-2xl" />
            <div>
              <p>Pending</p>
              <p className="font-bold">{statusStats.pending}</p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow flex items-center gap-3">
            <BsCheckCircleFill className="text-green-500 text-2xl" />
            <div>
              <p>Delivered</p>
              <p className="font-bold">{statusStats.delivered}</p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow flex items-center gap-3">
            <FaMoneyBillWave className="text-green-600 text-2xl" />
            <div>
              <p>Revenue</p>
              <p className="font-bold">{currency}{statusStats.totalRevenue.toFixed(2)}</p>
            </div>
          </div>

        </div>

        {/* 🔥 Orders */}
        {loading ? (
          <p>Loading...</p>
        ) : (
          filteredOrders.map((order, i) => (
            <div
              key={i}
              onClick={() => navigate(`/order/${order._id}`)}
              className="bg-white p-4 rounded-lg shadow mb-4 cursor-pointer hover:shadow-lg transition"
            >

              {/* Header */}
              <div className="flex justify-between mb-2">
                <div className="flex items-center gap-2">
                  <FaShoppingBag className="text-blue-500" />
                  <p>{order._id.slice(0, 10)}</p>
                </div>

                <p className="text-green-600 font-bold flex items-center gap-1">
                  <FaMoneyBillWave />
                  {(order.amount || 0).toFixed(2)}
                </p>
              </div>

              {/* Status */}
              <div className="flex items-center gap-2 mb-2">
                {getStatusIcon(order.status)}
                <span>{order.status}</span>
              </div>

              {/* Customer */}
              <div className="grid grid-cols-1 md:grid-cols-[1.5fr_1fr_1fr_1fr] gap-2 text-sm">

                <div className='flex items-center gap-3 min-w-0'>
                  <img
                    src={getAvatarUrl(order)}
                    alt={order.customerProfile?.name || order.address?.name || 'Customer'}
                    className='w-10 h-10 rounded-full object-cover border border-gray-200 flex-shrink-0'
                  />
                  <p className='truncate'><FaUser className="inline mr-1" /> {order.customerProfile?.name || order.address?.name}</p>
                </div>
                <p><FaEnvelope className="inline mr-1" /> {order.address?.email}</p>
                <p><FaPhone className="inline mr-1" /> {order.address?.phone}</p>
                <p><FaCalendarAlt className="inline mr-1" /> {new Date(order.date).toLocaleDateString()}</p>

              </div>

              {/* Progress */}
              <div className="w-full bg-gray-200 h-2 mt-3 rounded">
                <div
                  className="bg-green-500 h-2 rounded"
                  style={{ width: `${getJourneyProgress(order.status)}%` }}
                />
              </div>

              {/* Button */}
              <div className="mt-3 flex justify-end">
                <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-1 rounded">
                  <FaEye />
                  View
                </button>
              </div>

            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default OrderOverview