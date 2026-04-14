import React, { useContext, useState } from 'react'
import { assets } from '../assets/assets'
import { Link, NavLink } from 'react-router-dom'
import { ShopContext } from '../context/ShopContext'

const Navbar = () => {
  const [visible, setVisible] = useState(false)
 const {
  setShowSearch,
  getCartCount,
  navigate,
  token,
  setToken,
  setCartItems,
  userInfo,
  setUserInfo,
  selectedCurrency,
  updateCurrency,
  selectedLanguage,
  updateLanguage,
  selectedRegion,
  updateRegion,
  t
 } = useContext(ShopContext)

  const logout = () => {
    navigate('/login')
    localStorage.removeItem('token')
    setToken('')
    setCartItems({})
    setUserInfo(null)
  }

  return (
    <div className='flex items-center justify-between py-5 font-medium'>
      <Link to='/'><img src={assets.logo} className='w-36' alt="" /></Link>

      <ul className='hidden sm:flex gap-5 text-sm text-gray-700'>
        <NavLink to='/' className='flex flex-col items-center gap-1'>
          <p>{t('home')}</p>
          <hr className='w-2/4 border-none h-[1.5px] bg-gray-700 hidden' />
        </NavLink>
        <NavLink to='/collection' className='flex flex-col items-center gap-1'>
          <p>{t('collection')}</p>
          <hr className='w-2/4 border-none h-[1.5px] bg-gray-700 hidden' />
        </NavLink>
        <NavLink to='/about' className='flex flex-col items-center gap-1'>
          <p>{t('about')}</p>
          <hr className='w-2/4 border-none h-[1.5px] bg-gray-700 hidden' />
        </NavLink>
        <NavLink to='/contact' className='flex flex-col items-center gap-1'>  
          <p>{t('contact')}</p>
          <hr className='w-2/4 border-none h-[1.5px] bg-gray-700 hidden' />
        </NavLink>
      </ul>

      <div className='flex items-center gap-6'>
       <select
          value={selectedLanguage}
          onChange={(e) => updateLanguage(e.target.value)}
          className='hidden md:block text-xs border px-1 py-1 bg-white'
        >
          <option value='en'>EN</option>
          <option value='bn'>BN</option>
          <option value='hi'>HI</option>
        </select>

        <select
          value={selectedCurrency}
          onChange={(e) => updateCurrency(e.target.value)}
          className='hidden md:block text-xs border px-1 py-1 bg-white'
        >
          <option value='BDT'>BDT</option>
          <option value='USD'>USD</option>
          <option value='INR'>INR</option>
        </select>

        <select
          value={selectedRegion}
          onChange={(e) => updateRegion(e.target.value)}
          className='hidden md:block text-xs border px-1 py-1 bg-white'
        >
          <option value='global'>Global</option>
          <option value='domestic'>Bangladesh</option>
          <option value='south_asia'>South Asia</option>
          <option value='international'>International</option>
        </select>

       <img onClick={() => setShowSearch(true)} src={assets.search_icon} className='w-5 cursor-pointer' alt="" />

        <div className='group relative'>
          {/* Profile Icon or Avatar */}
          {token && userInfo?.avatar ? (
            <img
              src={userInfo.avatar}
              className='w-8 h-8 rounded-full cursor-pointer object-cover border-2 border-gray-300'
              alt={userInfo.name}
              onClick={() => token ? null : navigate('/login')}
            />
          ) : (
            <img
              onClick={() => token ? null : navigate('/login')}
              className='w-5 cursor-pointer'
              src={assets.profile_icon}
              alt=""
            />
          )}

          {/* Dropdown Menu */}
          {token &&
            <div className='group-hover:block hidden absolute dropdown-menu right-0 pt-4 z-50'>
              <div className='flex flex-col gap-2 w-44 py-3 px-5 bg-slate-100 text-gray-500 rounded shadow-lg'>
                {userInfo && (
                  <div className='flex items-center gap-2 pb-2 border-b border-gray-200'>
                    {userInfo.avatar ? (
                      <img src={userInfo.avatar} className='w-8 h-8 rounded-full object-cover' alt="" />
                    ) : (
                      <div className='w-8 h-8 rounded-full bg-black text-white flex items-center justify-center text-sm font-medium'>
                        {userInfo.name?.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className='text-xs font-medium text-black'>{userInfo.name}</p>
                      <p className='text-xs text-gray-400 truncate w-24'>{userInfo.email}</p>
                    </div>
                  </div>
                )}
                <p onClick={() => navigate('/profile')} className='cursor-pointer hover:text-black'>My Profile</p>
                <p onClick={() => navigate('/order')} className='cursor-pointer hover:text-black'>Orders</p>
                <p onClick={() => navigate('/wishlist')} className='cursor-pointer hover:text-black'>Wishlist</p>
                <p onClick={logout} className='cursor-pointer hover:text-black text-red-400'>Logout</p>
              </div>
            </div>
          }
        </div>

        <Link to='/cart' className='relative'>
          <img src={assets.cart_icon} className='w-5 min-w-5' alt="" />
          <p className='absolute right-[-5px] bottom-[-5px] w-4 text-center leading-4 bg-black text-white aspect-square rounded-full text-[8px]'>{getCartCount()}</p>
        </Link>
        <img onClick={() => setVisible(true)} src={assets.menu_icon} className='w-5 cursor-pointer sm:hidden' alt="" />
      </div>

      {/* Sidebar menu for small screens */}
      <div className={`absolute top-0 right-0 bottom-0 overflow-hidden bg-white transition-all ${visible ? 'w-full' : 'w-0'}`}>
        <div className='flex flex-col text-gray-600'>
          <div onClick={() => setVisible(false)} className='flex items-center gap-4 p-3 cursor-pointer'>
            <img className='h-4 rotate-180' src={assets.dropdown_icon} alt="" />
            <p>Back</p>
          </div>
          <NavLink onClick={() => setVisible(false)} className='py-2 pl-6 border' to='/'>HOME</NavLink>
          <NavLink onClick={() => setVisible(false)} className='py-2 pl-6 border' to='/collection'>COLLECTION</NavLink>
          <NavLink onClick={() => setVisible(false)} className='py-2 pl-6 border' to='/about'>ABOUT</NavLink>
          <NavLink onClick={() => setVisible(false)} className='py-2 pl-6 border' to='/contact'>CONTACT</NavLink>
        </div>
      </div>
    </div>
  )
}

export default Navbar