import React, { useContext, useEffect, useState } from 'react'
import Title from '../components/Title'
import { assets } from '../assets/assets'
import CartTotal from '../components/CartTotal'
import { ShopContext } from '../context/ShopContext'

const Cart = () => {
  const { products, currency, cartItems, updateQuantity, navigate, getProductPrice } = useContext(ShopContext)
  const [cartData, setCartData] = useState([])

  useEffect(() => {
    if (products.length > 0) {
      const tempData = []
      for (const items in cartItems) {
        for (const item in cartItems[items]) {
          if (cartItems[items][item] > 0) {
            tempData.push({
              _id: items,
              size: item,
              quantity: cartItems[items][item]
            })
          }
        }
      }
      setCartData(tempData)
    }
  }, [cartItems, products])

  return (
    <div className='border-t pt-14'>
      <div className='text-2xl mb-3'>
        <Title text1={'YOUR'} text2={'CART'} />
      </div>

      {/* Notification Message */}
      {cartData.length > 0 && (
        <div className='bg-yellow-50 border border-yellow-200 rounded p-3 mb-4 flex items-center gap-2 text-sm text-yellow-800'>
          <i className='fas fa-info-circle text-yellow-500'></i>
          <p>Items in your cart are not reserved. Complete your order before they sell out!</p>
        </div>
      )}

      <div>
        {cartData.map((item, index) => {
          const productData = products.find((product) => product._id === item._id)
          if (!productData) return null

          const originalPrice = productData.price
          const finalPrice = getProductPrice(productData)
          const hasDiscount = productData.discountActive && productData.discount > 0

          return (
            <div key={index} className='py-4 border-t border-b text-gray-700 grid grid-cols-[4fr_0.5fr_0.5fr] sm:grid-cols-[4fr_2fr_0.5fr] items-center gap-4'>
              <div className='flex items-start gap-6'>
                <div className='relative'>
                  <img className='w-16 sm:w-20' src={productData.image[0]} alt="" />
                  {hasDiscount && (
                    <span className='absolute top-0 left-0 bg-red-500 text-white text-xs px-1 rounded'>
                      {productData.discount}% OFF
                    </span>
                  )}
                </div>
                <div>
                  <p className='text-xs sm:text-lg font-medium'>{productData.name}</p>
                  <div className='flex items-center gap-3 mt-2'>
                    {hasDiscount ? (
                      <div className='flex items-center gap-2'>
                        <p className='text-red-500 font-medium'>{currency}{finalPrice.toFixed(2)}</p>
                        <p className='text-gray-400 line-through text-xs'>{currency}{originalPrice}</p>
                        <span className='bg-red-100 text-red-500 text-xs px-1 rounded'>
                          Save {currency}{(originalPrice - finalPrice).toFixed(2)}
                        </span>
                      </div>
                    ) : (
                      <p>{currency}{originalPrice}</p>
                    )}
                    <p className='px-2 sm:px-3 sm:py-1 border bg-slate-50'>{item.size}</p>
                  </div>
                </div>
              </div>
              <input
                onChange={(e) =>
                  e.target.value === '' || e.target.value === '0'
                    ? null
                    : updateQuantity(item._id, item.size, Number(e.target.value))
                }
                className='border max-w-10 sm:max-w-20 px-1 sm:px-2 py-1'
                type="number"
                min={1}
                defaultValue={item.quantity}
              />
              <img
                onClick={() => updateQuantity(item._id, item.size, 0)}
                className='w-4 mr-4 sm:w-5 cursor-pointer'
                src={assets.bin_icon}
                alt=""
              />
            </div>
          )
        })}
      </div>

      <div className='flex justify-end my-20'>
        <div className='w-full sm:w-[450px]'>
          <CartTotal />
          <div className='w-full text-end'>
            <button
              onClick={() => navigate('/place-order')}
              className='bg-black text-white text-sm my-8 px-8 py-3'
            >
              PROCEED TO CHECKOUT
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Cart