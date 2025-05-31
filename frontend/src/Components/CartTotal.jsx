import React, { useContext } from 'react'
import Titel from './Title'
import { ShopContext } from '../Context/ShopContext'

const CartTotal = () => {
  const { currency, delivery_fee, getCartAmount } = useContext(ShopContext)

  const subtotal = getCartAmount()
  const total = subtotal === 0 ? 0 : subtotal + delivery_fee

  return (
    <div className='w-full'>
      <div className='text-2xl'>
        <Titel text1={'CART'} text2={'TOTAL'} />
      </div>

      <div className='flex flex-col gap-2 mt-2 text-sm'>
        <div className='flex justify-between'>
          <p>Subtotal</p>
          <p>{currency} {subtotal}.00</p>
        </div>
        <hr />
        <div className='flex justify-between'>
          <p>Shipping Fee</p>
          <p>{currency} {subtotal === 0 ? 0 : delivery_fee}.00</p>
        </div>
        <hr />
        <div className='flex justify-between'>
          <b>Total</b>
          <b>{currency} {total}.00</b>
        </div>
      </div>
    </div>
  )
}

export default CartTotal