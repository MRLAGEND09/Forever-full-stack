import React, { useContext, useEffect } from 'react'
import { ShopContext } from '../context/ShopContext'
import ProductItem from './ProductItem'
import Title from './Title'

const ProductStrip = ({ title1, title2, items }) => {
  if (!items.length) return null

  return (
    <div className='my-14'>
      <div className='text-center text-2xl md:text-3xl py-2'>
        <Title text1={title1} text2={title2} />
      </div>
      <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 gap-y-6'>
        {items.map((item) => (
          <ProductItem
            key={item._id}
            id={item._id}
            image={item.image}
            name={item.name}
            price={item.dynamicPrice || item.price}
            discount={item.discount}
            discountActive={item.discountActive}
          />
        ))}
      </div>
    </div>
  )
}

const PersonalizedHomeSections = () => {
  const { token, personalizedHomeData, fetchPersonalizedHomeData } = useContext(ShopContext)

  useEffect(() => {
    if (token) {
      fetchPersonalizedHomeData()
    }
  }, [token])

  if (!token) return null

  return (
    <div>
      <ProductStrip title1='FOR YOU' title2='RECOMMENDED' items={personalizedHomeData.personalized || []} />
      <ProductStrip title1='RECENTLY' title2='VIEWED' items={personalizedHomeData.recentlyViewed || []} />
      <ProductStrip title1='TRENDING' title2='NOW' items={personalizedHomeData.trending || []} />
    </div>
  )
}

export default PersonalizedHomeSections
