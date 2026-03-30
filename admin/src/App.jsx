import React, { useEffect, useState, useRef } from 'react'
import Navbar from './components/Navbar'
import Sidebar from './components/Sidebar'
import { Routes, Route } from 'react-router-dom'
import Add from './pages/Add'
import List from './pages/List'
import Orders from './pages/Orders'
import Dashboard from './pages/Dashboard'
import Subscribers from './pages/Subscribers'
import Login from './components/Login'
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import axios from 'axios'
import notificationSound from './assets/notification.mp3'
import SalesReport from './pages/SalesReport'
import PendingOrders from './pages/PendingOrders'
import AbandonedCarts from './pages/AbandonedCarts'



export const bakendUrl = import.meta.env.VITE_BACKEND_URL
export const currency = '৳'

const App = () => {
  const [token, setToken] = useState(localStorage.getItem('token') ? localStorage.getItem('token') : '')
  const [newOrderCount, setNewOrderCount] = useState(0)
  const [newPendingCount, setNewPendingCount] = useState(0)
  const prevOrderCount = useRef(0)
  const prevPendingCount = useRef(0)

  useEffect(() => {
    localStorage.setItem('token', token)
  }, [token])

  useEffect(() => {
    if (!token) return

    const checkNewOrders = async () => {
      try {
        const response = await axios.post(`${bakendUrl}/api/order/list`, {}, { headers: { token } })
        if (response.data.success) {
          const currentCount = response.data.orders.length
          if (prevOrderCount.current > 0 && currentCount > prevOrderCount.current) {
            const diff = currentCount - prevOrderCount.current
            setNewOrderCount(diff)
            const audio = new Audio(notificationSound)
            audio.play().catch(() => {})
            toast.success(`🛍️ ${diff} new order received!`)
          }
          prevOrderCount.current = currentCount

          // Pending orders count
          const pendingOrders = response.data.orders.filter(o => o.accepted === 'pending')
          const pendingCount = pendingOrders.length
          if (prevPendingCount.current !== pendingCount) {
            setNewPendingCount(pendingCount)
            prevPendingCount.current = pendingCount
          }
        }
      } catch (error) {}
    }

    checkNewOrders()
    const interval = setInterval(checkNewOrders, 10000)
    return () => clearInterval(interval)
  }, [token])

  return (
    <div className='bg-gray-50 min-h-screen'>
      <ToastContainer />
      {token === ''
        ? <Login setToken={setToken} />
        : <>
          <Navbar setToken={setToken} />
          <hr />
          <div className='flex w-full'>
            <Sidebar
              newOrderCount={newOrderCount}
              setNewOrderCount={setNewOrderCount}
              newPendingCount={newPendingCount}
            />
            <div className='w-[70%] mx-auto ml-[max(5vh,25px)] my-8 text-gray-600 text-base'>
              <Routes>
                <Route path='/abandoned-carts' element={<AbandonedCarts token={token} />} />
                <Route path='/sales-report' element={<SalesReport token={token} />} />
                <Route path='/' element={<Dashboard token={token} />} />
                <Route path='/dashboard' element={<Dashboard token={token} />} />
                <Route path='/add' element={<Add token={token} />} />
                <Route path='/list' element={<List token={token} />} />
                <Route path='/orders' element={<Orders token={token} setNewOrderCount={setNewOrderCount} />} />
                <Route path='/subscribers' element={<Subscribers token={token} />} />
                <Route path='/pending-orders' element={<PendingOrders token={token} setNewPendingCount={setNewPendingCount} />} />
              </Routes>
            </div>
          </div>
        </>
      }
    </div>
  )
}

export default App