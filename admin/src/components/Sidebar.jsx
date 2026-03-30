import React from 'react'
import { NavLink } from 'react-router-dom'
import { assets } from '../assets/assets'
import '@fortawesome/fontawesome-free/css/all.min.css'

const Sidebar = ({ newOrderCount, setNewOrderCount, newPendingCount }) => {
  return (
    <div className='w-[18%] min-h-screen border-r-2'>
      <div className='flex flex-col gap-4 pt-6 pl-[20%] text-[15px]'>

        <NavLink className='flex items-center gap-3 border border-gray-300 border-r-0 px-3 py-2 rounded-l' to='/dashboard'>
          <i className='fas fa-chart-line text-gray-600'></i>
          <p className='hidden md:block'>Dashboard</p>
        </NavLink>

        <NavLink className='flex items-center gap-3 border border-gray-300 border-r-0 px-3 py-2 rounded-l' to='/add'>
          <img className='w-5 h-5' src={assets.add_icon} alt="" />
          <p className='hidden md:block'>Add Items</p>
        </NavLink>

        <NavLink className='flex items-center gap-3 border border-gray-300 border-r-0 px-3 py-2 rounded-l' to='/list'>
          <img className='w-5 h-5' src={assets.order_icon} alt="" />
          <p className='hidden md:block'>List Items</p>
        </NavLink>

        <NavLink
          className='flex items-center gap-3 border border-gray-300 border-r-0 px-3 py-2 rounded-l'
          to='/orders'
          onClick={() => setNewOrderCount(0)}
        >
          <img className='w-5 h-5' src={assets.order_icon} alt="" />
          <p className='hidden md:block'>Orders</p>
          {newOrderCount > 0 && (
            <span className='bg-red-500 text-white text-xs rounded-full px-2 py-0.5 ml-1'>{newOrderCount}</span>
          )}
        </NavLink>

        <NavLink
          className='flex items-center gap-3 border border-gray-300 border-r-0 px-3 py-2 rounded-l'
          to='/pending-orders'
        >
          <i className='fas fa-clock text-orange-500'></i>
          <p className='hidden md:block'>Pending Orders</p>
          {newPendingCount > 0 && (
            <span className='bg-orange-500 text-white text-xs rounded-full px-2 py-0.5 ml-1'>{newPendingCount}</span>
          )}
        </NavLink>

        <NavLink className='flex items-center gap-3 border border-gray-300 border-r-0 px-3 py-2 rounded-l' to='/subscribers'>
          <i className='fas fa-envelope text-gray-600'></i>
          <p className='hidden md:block'>Subscribers</p>
        </NavLink>

        <NavLink className='flex items-center gap-3 border border-gray-300 border-r-0 px-3 py-2 rounded-l' to='/sales-report'>
          <i className='fas fa-chart-bar text-gray-600'></i>
          <p className='hidden md:block'>Sales Report</p>
        </NavLink>
        
        <NavLink className='flex items-center gap-3 border border-gray-300 border-r-0 px-3 py-2 rounded-l' to='/abandoned-carts'>
          <i className='fas fa-shopping-cart text-yellow-500'></i>
          <p className='hidden md:block'>Abandoned Carts</p>
        </NavLink>

      </div>
    </div>
  )
}

export default Sidebar