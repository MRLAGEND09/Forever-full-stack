import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { bakendUrl } from '../App'
import { toast } from 'react-toastify'
import { useParams, useNavigate } from 'react-router-dom'
import '@fortawesome/fontawesome-free/css/all.min.css'

const OrderDetail = ({ token }) => {
  const { orderId } = useParams()
  const navigate = useNavigate()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await axios.post(`${bakendUrl}/api/order/list`, {}, { headers: { token } })
        if (res.data.success) {
          const foundOrder = res.data.orders.find(o => o._id === orderId)
          setOrder(foundOrder)
        }
        setLoading(false)
      } catch (error) {
        toast.error('Failed to load order')
        setLoading(false)
      }
    }
    fetchOrder()
  }, [orderId, token])

  if (loading) {
    return <div className='text-center py-20'>Loading...</div>
  }

  if (!order) {
    return (
      <div className='text-center py-20'>
        <p className='text-gray-500 mb-4'>Order not found</p>
        <button onClick={() => navigate('/admin')} className='bg-blue-600 text-white px-4 py-2 rounded'>
          Go Back
        </button>
      </div>
    )
  }

  const getMoneyPrefix = () => `${order?.currencyCode || 'BDT'} `
  const formatMoney = (value) => `${getMoneyPrefix()}${Number(value || 0).toFixed(2)}`

  const getStatusColor = (status) => {
    switch (status) {
      case 'Order Placed': return 'bg-yellow-100 text-yellow-800'
      case 'Confirmed': return 'bg-blue-100 text-blue-800'
      case 'Shipped': return 'bg-blue-100 text-blue-800'
      case 'Out For Delivery': return 'bg-orange-100 text-orange-800'
      case 'Delivered': return 'bg-green-100 text-green-800'
      case 'Cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStepStatus = (stepName) => {
    const steps = ['Order Placed', 'Confirmed', 'Shipped', 'Out For Delivery', 'Delivered']
    const currentIndex = steps.indexOf(order.status)
    const stepIndex = steps.indexOf(stepName)
    
    if (stepIndex < currentIndex) return 'completed'
    if (stepIndex === currentIndex) return 'active'
    return 'pending'
  }

  return (
    <div className='p-6'>
      <button
        onClick={() => navigate('/admin')}
        className='mb-6 bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400'
      >
        <i className='fas fa-arrow-left mr-2'></i>Back
      </button>

      <div className='bg-white rounded-lg shadow-lg p-8'>
        {/* Header */}
        <div className='mb-8 border-b pb-6'>
          <div className='flex justify-between items-start'>
            <div>
              <h1 className='text-3xl font-bold'>Order #{order.invoiceNumber}</h1>
              <p className='text-gray-500 mt-1'>Placed on {new Date(order.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
            <div className={`px-4 py-2 rounded font-semibold ${getStatusColor(order.status)}`}>
              {order.status}
            </div>
          </div>
        </div>

        {/* Order Timeline */}
        <div className='mb-8 p-6 bg-gray-50 rounded-lg'>
          <h2 className='text-xl font-bold mb-6'>Order Journey</h2>
          <div className='flex justify-between items-center'>
            {['Order Placed', 'Confirmed', 'Shipped', 'Out For Delivery', 'Delivered'].map((step, index) => (
              <div key={index} className='flex flex-col items-center flex-1'>
                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-white mb-2 ${
                  getStepStatus(step) === 'completed' ? 'bg-green-500' :
                  getStepStatus(step) === 'active' ? 'bg-blue-500' :
                  'bg-gray-300'
                }`}>
                  {getStepStatus(step) === 'completed' ? <i className='fas fa-check'></i> : index + 1}
                </div>
                <p className='text-sm text-center font-medium text-gray-700'>{step}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Order Details */}
        <div className='grid grid-cols-1 md:grid-cols-2 gap-8 mb-8'>
          {/* Customer Info */}
          <div className='border rounded-lg p-6'>
            <h3 className='text-lg font-bold mb-4'>Customer Info</h3>
            <p className='text-gray-600 mb-2'><strong>Name:</strong> {order.address.firstName} {order.address.lastName}</p>
            <p className='text-gray-600 mb-2'><strong>Email:</strong> {order.address.email}</p>
            <p className='text-gray-600 mb-2'><strong>Phone:</strong> {order.address.phone}</p>
            <p className='text-gray-600 mb-2'><strong>Address:</strong> {order.address.street}, {order.address.city}, {order.address.country}</p>
            <p className='text-gray-600'><strong>Zip:</strong> {order.address.zipcode}</p>
          </div>

          {/* Payment Info */}
          <div className='border rounded-lg p-6'>
            <h3 className='text-lg font-bold mb-4'>Payment Details</h3>
            <p className='text-gray-600 mb-2'><strong>Method:</strong> {order.paymentMethod}</p>
            <p className='text-gray-600 mb-2'><strong>Status:</strong> {order.payment ? '✅ Paid' : '❌ Pending'}</p>
            <p className='text-gray-600 mb-2'><strong>Currency:</strong> {order.currencyCode || 'BDT'}</p>
            <p className='text-gray-600 mb-2'><strong>Amount:</strong> {formatMoney(order.amount)}</p>
            <p className='text-gray-600 mb-2'><strong>Shipping Fee:</strong> {formatMoney(order.shippingFee || 70)}</p>
            {order.couponDiscount > 0 && (
              <p className='text-gray-600'><strong>Discount:</strong> {formatMoney(order.couponDiscount)}</p>
            )}
            {order.productDiscount > 0 && (
              <p className='text-gray-600'><strong>Product Discount:</strong> {formatMoney(order.productDiscount)}</p>
            )}
          </div>

          <div className='border rounded-lg p-6'>
            <h3 className='text-lg font-bold mb-4'>Shipping & Schedule</h3>
            <p className='text-gray-600 mb-2'><strong>Region:</strong> {order.shippingRegion || 'domestic'}</p>
            <p className='text-gray-600 mb-2'><strong>Method:</strong> {order.shippingMethod || 'standard'}</p>
            <p className='text-gray-600 mb-2'><strong>Slot:</strong> {order.deliverySlot || 'anytime'}</p>
            <p className='text-gray-600 mb-2'><strong>Scheduled At:</strong> {order.scheduledDeliveryAt ? new Date(order.scheduledDeliveryAt).toLocaleString() : 'Not scheduled'}</p>
            <p className='text-gray-600'><strong>Delivered At:</strong> {order.deliveredAt ? new Date(order.deliveredAt).toLocaleString() : 'Not delivered yet'}</p>
          </div>
        </div>

        {/* Items */}
        <div className='mb-8 border rounded-lg p-6'>
          <h3 className='text-lg font-bold mb-4'>Order Items</h3>
          <table className='w-full border-collapse'>
            <thead>
              <tr className='border-b-2'>
                <th className='text-left p-2'>Product</th>
                <th className='text-center p-2'>Size</th>
                <th className='text-center p-2'>Qty</th>
                <th className='text-right p-2'>Price</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item, index) => (
                <tr key={index} className='border-b hover:bg-gray-50'>
                  <td className='p-2'>{item.name}</td>
                  <td className='text-center p-2'>{item.size}</td>
                  <td className='text-center p-2'>{item.quantity}</td>
                  <td className='text-right p-2'>{formatMoney(item.price * item.quantity)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className='mt-4 text-right text-lg font-bold'>
            Total: {formatMoney(order.amount)}
          </div>
        </div>

        {/* Additional Info */}
        {order.accepted && (
          <div className='bg-green-50 border border-green-200 rounded-lg p-4 mb-4'>
            <p><strong><i className='fas fa-check text-green-600 mr-2'></i>Order Status:</strong> {order.accepted === 'accepted' ? 'Accepted' : 'Rejected'}</p>
            {order.rejectedReason && <p className='text-red-600'><strong>Rejection Reason:</strong> {order.rejectedReason}</p>}
          </div>
        )}
      </div>
    </div>
  )
}

export default OrderDetail
