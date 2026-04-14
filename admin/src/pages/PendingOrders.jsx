import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { bakendUrl, currency } from '../App'
import { toast } from 'react-toastify'
import { assets } from '../assets/assets'
import { FaCheck, FaTimes, FaClock, FaEnvelope, FaMobileAlt, FaBoxOpen } from 'react-icons/fa'

const PendingOrders = ({ token, setNewPendingCount }) => {
  const [orders, setOrders] = useState([])
  const [showChannelModal, setShowChannelModal] = useState(false)
  const [selectedOrderId, setSelectedOrderId] = useState(null)
  const [selectedChannel, setSelectedChannel] = useState('email')
  const [isSubmittingAccept, setIsSubmittingAccept] = useState(false)

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

  const handleAccept = (orderId) => {
    setSelectedOrderId(orderId)
    setSelectedChannel('email')
    setShowChannelModal(true)
  }

  const confirmAccept = async () => {
    if (!selectedOrderId || isSubmittingAccept) return
    setIsSubmittingAccept(true)
    try {
      const res = await axios.post(`${bakendUrl}/api/order/accept`, {
        orderId: selectedOrderId,
        accepted: 'accepted',
        notify: selectedChannel
      }, { headers: { token } })
      if (res.data.success) {
        toast.success(res.data.duplicate ? 'Order already accepted. Duplicate send blocked.' : `Order accepted! Confirmation sent via ${selectedChannel}!`)
        setShowChannelModal(false)
        setSelectedOrderId(null)
        fetchPendingOrders()
      }
    } catch (error) {
      toast.error(error.message)
    } finally {
      setIsSubmittingAccept(false)
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
        <h3 className='text-xl font-semibold flex items-center gap-2'>
          <FaClock className='text-orange-500' /> Pending Orders
        </h3>
        <p className='text-sm text-gray-500'>
          Total: <span className='font-bold text-orange-500'>{orders.length}</span>
        </p>
      </div>

      {orders.length === 0 ? (
        <div className='text-center py-20 text-gray-400'>
          <FaCheck className='text-4xl text-green-400 mx-auto mb-3' />
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
                <p className='text-blue-500 mt-1 flex items-center gap-1'>
                  <FaEnvelope /> {order.address.email}
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
                <p className='text-xs text-orange-500 mt-1 flex items-center gap-1'>
                  <FaClock /> Awaiting approval
                </p>
                {order.invoiceNumber && (
                  <p className='text-xs text-gray-400 mt-1'>#{order.invoiceNumber}</p>
                )}
              </div>

              <div className='flex flex-col gap-2'>
                <button
                  onClick={() => handleAccept(order._id)}
                  className='flex items-center justify-center gap-1 bg-green-500 text-white px-4 py-2 text-xs rounded hover:bg-green-600'
                >
                  <FaCheck /> Accept
                </button>
                <button
                  onClick={() => handleReject(order._id)}
                  className='flex items-center justify-center gap-1 bg-red-500 text-white px-4 py-2 text-xs rounded hover:bg-red-600'
                >
                  <FaTimes /> Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Channel Modal */}
      {showChannelModal && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
          <div className='bg-white rounded-lg p-8 max-w-sm w-full mx-4 shadow-2xl'>
            <h2 className='text-xl font-bold mb-2 text-center'>Send Confirmation</h2>
            <p className='text-gray-600 text-center mb-6 text-sm'>How should the customer receive order confirmation?</p>

            <div className='space-y-3 mb-6'>
              <label className={`w-full p-4 rounded-lg border-2 flex items-center gap-3 cursor-pointer transition ${selectedChannel === 'email' ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-300'}`}>
                <input
                  type='radio'
                  name='channel'
                  value='email'
                  checked={selectedChannel === 'email'}
                  onChange={() => setSelectedChannel('email')}
                  className='w-5 h-5'
                />
                <div>
                  <p className='font-semibold flex items-center gap-1'><FaEnvelope className='text-blue-500' /> Email</p>
                  <p className='text-xs text-gray-500'>Send confirmation to email</p>
                </div>
              </label>

              <label className={`w-full p-4 rounded-lg border-2 flex items-center gap-3 cursor-pointer transition ${selectedChannel === 'phone' ? 'border-green-500 bg-green-50' : 'border-gray-300 hover:border-green-300'}`}>
                <input
                  type='radio'
                  name='channel'
                  value='phone'
                  checked={selectedChannel === 'phone'}
                  onChange={() => setSelectedChannel('phone')}
                  className='w-5 h-5'
                />
                <div>
                  <p className='font-semibold flex items-center gap-1'><FaMobileAlt className='text-green-500' /> SMS</p>
                  <p className='text-xs text-gray-500'>Send confirmation via SMS</p>
                </div>
              </label>
            </div>

            <div className='flex gap-3'>
              <button
                onClick={() => setShowChannelModal(false)}
                disabled={isSubmittingAccept}
                className='flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg hover:bg-gray-300 font-semibold transition'
              >
                Cancel
              </button>
              <button
                onClick={confirmAccept}
                disabled={isSubmittingAccept}
                className='flex-1 bg-blue-600 disabled:bg-blue-300 text-white py-2 rounded-lg hover:bg-blue-700 font-semibold transition flex items-center justify-center gap-1'
              >
                <FaCheck /> {isSubmittingAccept ? 'Sending...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PendingOrders