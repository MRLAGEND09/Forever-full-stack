import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { bakendUrl, currency } from '../App'
import { toast } from 'react-toastify'
import '@fortawesome/fontawesome-free/css/all.min.css'

const AbandonedCarts = ({ token }) => {
  const [carts, setCarts] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchAbandonedCarts = async () => {
    try {
      const res = await axios.get(`${bakendUrl}/api/abandoned/list`, { headers: { token } })
      if (res.data.success) {
        setCarts(res.data.carts)
      }
    } catch (error) {
      toast.error(error.message)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchAbandonedCarts()
    const interval = setInterval(fetchAbandonedCarts, 30000)
    return () => clearInterval(interval)
  }, [token])

  const getTimeAgo = (date) => {
    const diff = Date.now() - new Date(date).getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)
    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`
  }

  return (
    <div>
      <div className='flex items-center justify-between mb-6'>
        <h3 className='text-xl font-semibold'>
          <i className='fas fa-shopping-cart text-yellow-500 mr-2'></i>
          Abandoned Carts
        </h3>
        <p className='text-sm text-gray-500'>
          Total: <span className='font-bold text-yellow-500'>{carts.length}</span>
        </p>
      </div>

      {loading ? (
        <div className='text-center py-20 text-gray-400'>
          <i className='fas fa-spinner fa-spin text-2xl'></i>
        </div>
      ) : carts.length === 0 ? (
        <div className='text-center py-20 text-gray-400'>
          <i className='fas fa-check-circle text-4xl text-green-400 mb-3'></i>
          <p className='mt-2'>No abandoned carts!</p>
        </div>
      ) : (
        <div className='flex flex-col gap-4'>
          {carts.map((cart, index) => (
            <div key={index} className='border-2 border-yellow-200 bg-yellow-50 rounded-lg p-5'>
              <div className='flex justify-between items-start mb-3'>
                <div>
                  <p className='text-xs text-gray-400'>
                    <i className='fas fa-clock mr-1'></i>
                    {getTimeAgo(cart.createdAt)}
                  </p>
                  <p className='text-xs text-gray-400 mt-1'>
                    User ID: {cart.userId}
                  </p>
                </div>
                <div className='text-right'>
                  <p className='font-medium text-sm'>{currency}{cart.amount}</p>
                  <span className='bg-yellow-400 text-white text-xs px-2 py-0.5 rounded'>
                    Abandoned
                  </span>
                </div>
              </div>

              <div className='border-t pt-3'>
                <p className='text-xs font-medium text-gray-500 mb-2'>Items:</p>
                {cart.items.map((item, i) => (
                  <div key={i} className='flex items-center gap-3 mb-2'>
                    {item.image && item.image[0] && (
                      <img src={item.image[0]} className='w-10 h-10 object-cover rounded' alt="" />
                    )}
                    <div>
                      <p className='text-sm font-medium'>{item.name}</p>
                      <p className='text-xs text-gray-500'>
                        {currency}{item.price} × {item.quantity} | Size: {item.size}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default AbandonedCarts