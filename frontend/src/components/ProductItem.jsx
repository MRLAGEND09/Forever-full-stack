import React, { useContext, useState, useEffect } from 'react'
import { ShopContext } from '../context/ShopContext'
import { Link } from 'react-router-dom'
import axios from 'axios'

const ProductItem = ({ id, image, name, price, discount, discountActive }) => {
  const { currency, token, addToWishlist, removeFromWishlist, isInWishlist, backendUrl, convertPrice } = useContext(ShopContext)
  const [reviews, setReviews] = useState([])
  const [averageRating, setAverageRating] = useState(0)

  useEffect(() => {
    fetchReviews()
  }, [id])

  const fetchReviews = async () => {
    try {
      const response = await axios.post(backendUrl + '/api/review/product', { productId: id })
      if (response.data.success) {
        setReviews(response.data.reviews)
        if (response.data.reviews.length > 0) {
          const avgRating = (response.data.reviews.reduce((sum, review) => sum + review.rating, 0) / response.data.reviews.length).toFixed(1)
          setAverageRating(avgRating)
        }
      }
    } catch (error) {
      console.log(error)
    }
  }

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i} className={i < Math.floor(rating) ? 'text-yellow-400 text-xs' : 'text-gray-300 text-xs'}>
        ★
      </span>
    ))
  }

  const handleWishlistClick = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (isInWishlist(id)) {
      removeFromWishlist(id)
    } else {
      addToWishlist(id)
    }
  }

  const discountedPrice = discountActive && discount > 0
    ? (price - (price * discount / 100)).toFixed(2)
    : null

  const finalPrice = discountedPrice ? convertPrice(discountedPrice) : convertPrice(price)
  const originalPrice = convertPrice(price)

  return (
    <Link className='text-gray-700 cursor-pointer' to={`/product/${id}`}>
      <div className='overflow-hidden relative'>
        <img
          className='hover:scale-110 transition ease-in-out'
          src={image[0]}
          alt={name}
        />
        {discountActive && discount > 0 && (
          <span className='absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded'>
            {discount}% OFF
          </span>
        )}
        {token && (
          <button
            onClick={handleWishlistClick}
            className='absolute top-2 right-2 bg-white p-2 rounded-full shadow-md hover:bg-gray-50'
          >
            <i className={`fas fa-heart ${isInWishlist(id) ? 'text-red-500' : 'text-gray-400'}`}></i>
          </button>
        )}
      </div>
      <p className='pt-3 pb-1 text-sm'>{name}</p>
      {discountedPrice ? (
        <div className='flex items-center gap-2'>
          <p className='text-sm font-medium text-red-500'>{currency}{finalPrice}</p>
          <p className='text-xs text-gray-400 line-through'>{currency}{originalPrice}</p>
        </div>
      ) : (
        <p className='text-sm font-medium'>{currency}{finalPrice}</p>
      )}
      {reviews.length > 0 && (
        <div className='flex items-center gap-2 mt-2'>
          <div className='flex gap-0.5'>
            {renderStars(averageRating)}
          </div>
          <span className='text-xs text-gray-600'>({reviews.length})</span>
        </div>
      )}
    </Link>
  )
}

export default ProductItem