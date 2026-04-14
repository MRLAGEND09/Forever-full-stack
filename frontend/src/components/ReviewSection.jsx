import React, { useContext, useEffect, useState } from 'react'
import { ShopContext } from '../context/ShopContext'
import axios from 'axios'
import { toast } from 'react-toastify'

const ReviewSection = ({ productId }) => {
  const { backendUrl, token, products, currency } = useContext(ShopContext)
  const [reviews, setReviews] = useState([])
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [userOrders, setUserOrders] = useState([])
  const [canReview, setCanReview] = useState(false)
  const [selectedOrderId, setSelectedOrderId] = useState(null)
  const [photoUrlsText, setPhotoUrlsText] = useState('')

  const fetchReviews = async () => {
    try {
      const response = await axios.post(backendUrl + '/api/review/product', { productId })
      if (response.data.success) {
        setReviews(response.data.reviews)
      }
    } catch (error) {
      console.log(error)
    }
  }

  const fetchUserOrders = async () => {
    if (!token) return
    try {
      const response = await axios.post(backendUrl + '/api/order/user-orders', {}, { headers: { token } })
      if (response.data.success) {
        setUserOrders(response.data.orders)
        checkIfCanReview(response.data.orders)
      }
    } catch (error) {
      console.log(error)
    }
  }

  const checkIfCanReview = (orders) => {
    // Find orders containing this product
    const ordersWithProduct = orders.filter(order => 
      order.items && order.items.some(item => item._id === productId)
    )

    if (ordersWithProduct.length === 0) {
      setCanReview(false)
      return
    }

    // Check which orders don't have reviews yet
    const reviewedOrderIds = new Set(reviews.map(r => r.orderId?._id || r.orderId))
    const unreviewedOrders = ordersWithProduct.filter(order => !reviewedOrderIds.has(order._id))

    if (unreviewedOrders.length > 0) {
      setCanReview(true)
      setSelectedOrderId(unreviewedOrders[0]._id)
    } else {
      setCanReview(false)
    }
  }

  const submitReview = async () => {
    if (!token) {
      toast.error('Please login to add a review')
      return
    }

    if (!comment.trim()) {
      toast.error('Please enter a comment')
      return
    }

    if (!selectedOrderId) {
      toast.error('Please select an order')
      return
    }

    try {
      const photoUrls = photoUrlsText
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
        .slice(0, 4)

      const response = await axios.post(backendUrl + '/api/review/add', {
        productId,
        orderId: selectedOrderId,
        rating,
        comment,
        photoUrls
      }, { headers: { token } })

      if (response.data.success) {
        toast.success('Review added successfully!')
        setComment('')
        setRating(5)
        setPhotoUrlsText('')
        setShowForm(false)
        fetchReviews()
        fetchUserOrders()
      } else {
        toast.error(response.data.message)
      }
    } catch (error) {
      toast.error(error.message)
    }
  }

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i} className={i < rating ? 'text-yellow-400' : 'text-gray-300'}>
        ★
      </span>
    ))
  }

  useEffect(() => {
    fetchReviews()
    fetchUserOrders()
  }, [productId, token])

  return (
    <div className='mt-20'>
      <div className='flex justify-between items-center mb-4'>
        <div className='flex'>
          <b className='border px-5 py-3 text-sm'>Description</b>
          <p className='border px-5 py-3 text-sm'>Reviews ({reviews.length})</p>
        </div>
        {token && canReview && (
          <button
            onClick={() => setShowForm(!showForm)}
            className='bg-black text-white px-4 py-2 text-sm rounded'
          >
            {showForm ? 'Cancel' : 'Write Review'}
          </button>
        )}
      </div>

      {/* Review Form */}
      {showForm && canReview && (
        <div className='border p-6 mb-6 bg-gray-50'>
          <h3 className='text-lg font-medium mb-4'>Write a Review</h3>
          <div className='mb-4'>
            <label className='block text-sm font-medium mb-2'>Rating</label>
            <div className='flex gap-1'>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  className={`text-2xl ${star <= rating ? 'text-yellow-400' : 'text-gray-300'}`}
                >
                  ★
                </button>
              ))}
            </div>
          </div>
          <div className='mb-4'>
            <label className='block text-sm font-medium mb-2'>Comment</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className='w-full p-3 border rounded'
              rows={4}
              placeholder='Share your thoughts about this product...'
            />
          </div>
          <div className='mb-4'>
            <label className='block text-sm font-medium mb-2'>Photo URLs (optional, comma separated)</label>
            <input
              value={photoUrlsText}
              onChange={(e) => setPhotoUrlsText(e.target.value)}
              className='w-full p-3 border rounded'
              placeholder='https://image1.jpg, https://image2.jpg'
            />
          </div>
          <button
            onClick={submitReview}
            className='bg-black text-white px-6 py-2 rounded hover:bg-gray-800'
          >
            Submit Review
          </button>
        </div>
      )}

      {/* Reviews List */}
      <div className='border px-6 py-6 text-sm text-gray-500'>
        {reviews.length === 0 ? (
          <p>No reviews yet. {token ? (canReview ? 'Share your experience!' : 'Order this product to leave a review!') : 'Login to review this product!'}</p>
        ) : (
          <div className='space-y-6'>
            {reviews.map((review, index) => {
              const product = products.find(p => p._id === productId)
              const productDiscount = product?.discount || 0
              return (
                <div key={review._id || `${review.userId?._id || review.userId}-${review.date || index}`} className='border-b pb-4 last:border-b-0'>
                  <div className='flex items-center justify-between mb-2'>
                    <div className='flex items-center gap-3'>
                      <span className='font-medium text-gray-800'>{review.userId.name}</span>
                      <div className='flex'>
                        {renderStars(review.rating)}
                      </div>
                    </div>
                    <div className='flex items-center gap-3'>
                      {review.verifiedPurchase && (
                        <span className='text-[11px] px-2 py-1 rounded bg-green-100 text-green-700'>Verified Purchase</span>
                      )}
                      {product && productDiscount > 0 && (
                        <span className='bg-red-100 text-red-600 font-semibold px-2 py-1 rounded text-sm'>
                          {productDiscount}% OFF
                        </span>
                      )}
                      {product && (
                        <span className='font-medium text-gray-800 text-lg'>{currency}{product.price}</span>
                      )}
                    </div>
                  </div>
                  <p className='text-gray-600 mb-2'>{review.comment}</p>
                  {Array.isArray(review.photoUrls) && review.photoUrls.length > 0 && (
                    <div className='flex flex-wrap gap-2 mb-2'>
                      {review.photoUrls.map((url, photoIndex) => (
                        <img key={`${url}-${photoIndex}`} src={url} alt='review' className='w-16 h-16 object-cover rounded border' />
                      ))}
                    </div>
                  )}
                  <p className='text-xs text-gray-400'>
                    {new Date(review.date).toLocaleDateString()}
                  </p>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default ReviewSection