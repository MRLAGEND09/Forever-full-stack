import React, { useContext, useEffect, useState } from 'react'
import Titel from './Title'
import ProductItem from './ProductItem'
import { ShopContext } from '../context/ShopContext'

const uniqueProductsById = (items = [], excludedIds = []) => {
  const seen = new Set(excludedIds.filter(Boolean))

  return items.filter((item) => {
    const productId = item?._id
    if (!productId || seen.has(productId)) {
      return false
    }

    seen.add(productId)
    return true
  })
}

const RelatedProducts = ({ category, subCategory, productId }) => {
  const { products, getRecommendations } = useContext(ShopContext)
  const [related, setRelated] = useState([])
  const [alsoBought, setAlsoBought] = useState([])

  useEffect(() => {
    const loadRecommendations = async () => {
      const response = await getRecommendations(productId)
      if (response?.similarProducts?.length) {
        const uniqueAlsoBought = uniqueProductsById(response.customersAlsoBought, [productId]).slice(0, 5)
        const uniqueRelated = uniqueProductsById(response.similarProducts, [productId, ...uniqueAlsoBought.map((item) => item._id)]).slice(0, 5)

        setRelated(uniqueRelated)
        setAlsoBought(uniqueAlsoBought)
        return
      }

      if (products.length > 0) {
        const filtered = products.filter(
          (item) => item.category === category && item.subCategory === subCategory && item._id !== productId
        )
        setRelated(uniqueProductsById(filtered, [productId]).slice(0, 5))
        setAlsoBought([])
      }
    }

    loadRecommendations()
  }, [products, category, subCategory, productId])

  return (
    <div className='my-24 space-y-14'>
      {alsoBought.length > 0 && (
        <div>
          <div className='text-center text-3xl py-2'>
            <Titel text1={'CUSTOMERS ALSO'} text2={'BOUGHT'} />
          </div>
          <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 gap-y-6'>
            {alsoBought.map((item) => (
              <ProductItem
                key={item._id}
                id={item._id}
                image={item.image}
                name={item.name}
                price={item.dynamicPrice || item.price}
              />
            ))}
          </div>
        </div>
      )}

      <div>
        <div className='text-center text-3xl py-2'>
          <Titel text1={'SIMILAR'} text2={'PRODUCTS'} />
        </div>
        <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 gap-y-6'>
          {related.map((item) => (
            <ProductItem
              key={item._id}
              id={item._id}
              image={item.image}
              name={item.name}
              price={item.dynamicPrice || item.price}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

export default RelatedProducts