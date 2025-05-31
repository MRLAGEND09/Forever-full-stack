import React, { useContext, useEffect, useState } from 'react'
import Titel from './Title'
import ProductItem from './ProductItem'
import { ShopContext } from '../Context/ShopContext'

const LatestCollection = () => {
  const { products } = useContext(ShopContext)
  const [latestproducts, setlatestproducts] = useState([])

  useEffect(() => {
    setlatestproducts(products.slice(0, 10))
  }, [products])

  return (
    <div className='my-10'>
      <div className='text-center py-8 text-3xl'>
        <Titel text1={'LATEST'} text2={'COLLECTION'} />
        <p className='w-3/4 m-auto text-xs sm:text-base text-gray-600'>
          Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the standard dummy text ever since the 1500s.
        </p>
      </div>

      {/* rendering products */}
      <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 gap-y-6'>
        {latestproducts.map((item, index) => (
          <ProductItem
            key={index}
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

export default LatestCollection