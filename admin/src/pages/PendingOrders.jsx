import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { bakendUrl, currency } from '../App'
import { toast } from 'react-toastify'
import '@fortawesome/fontawesome-free/css/all.min.css'
import { assets } from '../assets/assets'

const PendingOrders = ({ token, setNewPendingCount }) => {
  const [orders, setOrders] = useState([])

  const fetchPendingOrders = async () => {
    try {
      const res = await axios.post(`${bakendUrl}/api/order/pending`, {}, { headers: { token } })
      if (res.data.success) {
        setOrders(res.data.orders)
        setNewPendingCount && setNewPendingCount(res.data.orders.length)
      }
    } catch (error) {
      toast.error(error.message)
    }
  }

  const handleAccept = async (orderId) => {
    try {
      const res = await axios.post(`${bakendUrl}/api/order/accept`, {
        orderId,
        accepted: 'accepted'
      }, { headers: { token } })
      if (res.data.success) {
        toast.success('Order accepted!')
        fetchPendingOrders()
      }
    } catch (error) {
      toast.error(error.message)
    }
  }

  const handleReject = async (orderId) => {
    const reason = prompt('Enter rejection reason:')
    if (!reason) return
    try {
      const res = await axios.post(`${bakendUrl}/api/order/accept`, {
        orderId,
        accepted: 'rejected',
        rejectedReason: reason
      }, { headers: { token } })
      if (res.data.success) {
        toast.success('Order rejected!')
        fetchPendingOrders()
      }
    } catch (error) {
      toast.error(error.message)
    }
  }

  useEffect(() => {
    fetchPendingOrders()
    const interval = setInterval(fetchPendingOrders, 10000)
    return () => clearInterval(interval)
  }, [token])

  return (
    <div>
      <div className='flex items-center justify-between mb-4'>
        <h3 className='text-xl font-semibold'>
          <i className='fas fa-clock text-orange-500 mr-2'></i>
          Pending Orders
        </h3>
        <p className='text-sm text-gray-500'>
          Total: <span className='font-bold text-orange-500'>{orders.length}</span>
        </p>
      </div>

      {orders.length === 0 ? (
        <div className='text-center py-20 text-gray-400'>
          <i className='fas fa-check-circle text-4xl text-green-400 mb-3'></i>
          <p>No pending orders!</p>
        </div>
      ) : (
        <div>
          {orders.map((order, index) => (
            <div
              key={index}
              className='grid grid-cols-1 sm:grid-cols-[0.5fr_2fr_1fr_1fr_1fr] gap-3 items-start border-2 border-orange-200 bg-orange-50 p-5 md:p-6 my-3 text-xs sm:text-sm text-gray-700 rounded'
            >
              <img className='w-12' src={assets.parcel_icon} alt="" />

              <div>
                <div>
                  {order.items.map((item, i) => (
                    <p key={i} className='py-0.5'>
                      {item.name} x {item.quantity} <span>{item.size}</span>
                    </p>
                  ))}
                </div>
                <p className='mt-3 font-medium'>
                  {order.address.firstName} {order.address.lastName}
                </p>
                <p>{order.address.street},</p>
                <p>{order.address.city}, {order.address.country}</p>
                <p>{order.address.phone}</p>
                <p className='text-blue-500 mt-1'>
                  <i className='fas fa-envelope mr-1'></i>
                  {order.address.email}
                </p>
              </div>

              <div>
                <p>Items: {order.items.length}</p>
                <p className='mt-2'>Method: {order.paymentMethod}</p>
                <p>Payment: {order.payment ? '✅ Done' : '⏳ Pending'}</p>
                <p>Date: {new Date(order.date).toLocaleDateString()}</p>
              </div>

              <div>
                <p className='text-sm font-medium'>{currency}{order.amount}</p>
                <p className='text-xs text-orange-500 mt-1'>
                  <i className='fas fa-clock mr-1'></i>
                  Awaiting approval
                </p>
                {order.invoiceNumber && (
                  <p className='text-xs text-gray-400 mt-1'>
                    #{order.invoiceNumber}
                  </p>
                )}
              </div>

              <div className='flex flex-col gap-2'>
                <button
                  onClick={() => handleAccept(order._id)}
                  className='bg-green-500 text-white px-4 py-2 text-xs rounded hover:bg-green-600'
                >
                  <i className='fas fa-check mr-1'></i> Accept
                </button>
                <button
                  onClick={() => handleReject(order._id)}
                  className='bg-red-500 text-white px-4 py-2 text-xs rounded hover:bg-red-600'
                >
                  <i className='fas fa-times mr-1'></i> Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default PendingOrders