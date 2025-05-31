import React, { useContext, useEffect, useState } from 'react'
import Titel from './Title'
import ProductItem from './ProductItem'
import { ShopContext } from '../Context/ShopContext'

const BestSeller = () => {
  const { products } = useContext(ShopContext)
  const [bestseller, setBestSeller] = useState([])

  useEffect(() => {
    const bestproduct = products.filter(item => item.bestseller)
    setBestSeller(bestproduct.slice(0, 5))
  }, [products])

  return (
    <div className='my-10'>
      <div className='text-center text-3xl py-8'>
        <Titel text1={'BEST'} text2={'SELLER'} />
        <p className='w-3/4 m-auto text-xs sm:text-base text-gray-600'>
          Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the standard dummy text ever since the 1500s.
        </p>
      </div>
      <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 gap-y-6'>
        {bestseller.map((item, index) => (
          <ProductItem
            key={item._id || index}
            id={item._id}
            image={item.image}
            name={item.name}
            price={item.price}
          />
        ))}
      </div>
    </div>
  )
}

export default BestSeller