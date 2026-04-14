import React, { useContext, useEffect } from 'react'
import { ShopContext } from '../context/ShopContext'
import Title from '../components/Title'
import ProductItem from '../components/ProductItem'
import { toast } from 'react-toastify'
import { useLocation } from 'react-router-dom'

const Wishlist = () => {
  const { wishlist, token, navigate, createWishlistShareLink, fetchSharedWishlist } = useContext(ShopContext)
  const [sharedList, setSharedList] = React.useState([])
  const location = useLocation()

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const shareToken = params.get('share')

    if (shareToken) {
      fetchSharedWishlist(shareToken).then((data) => setSharedList(data))
      return
    }

    if (!token) {
      navigate('/login')
    }
  }, [token, navigate, location.search])

  const listToShow = sharedList.length ? sharedList : wishlist

  if (!token && sharedList.length === 0) {
    return null
  }

  const handleShareWishlist = async () => {
    const shareUrl = await createWishlistShareLink()
    if (!shareUrl) {
      toast.error('Could not create share link')
      return
    }
    await navigator.clipboard.writeText(shareUrl)
    toast.success('Wishlist share link copied')
  }

  return (
    <div className='border-t pt-16'>
      <div className='text-2xl mb-3'>
        <Title text1={'MY'} text2={'WISHLIST'} />
      </div>

      {!sharedList.length && token && (
        <button type='button' onClick={handleShareWishlist} className='mb-5 border px-4 py-2 text-sm hover:bg-gray-50'>
          Share Wishlist
        </button>
      )}

      {listToShow.length === 0 ? (
        <div className='text-center py-20'>
          <p className='text-gray-500 text-lg'>Your wishlist is empty</p>
          <p className='text-gray-400 mt-2'>Add items you love to your wishlist!</p>
        </div>
      ) : (
        <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 gap-y-6'>
          {listToShow.map((item) => (
            <ProductItem
              key={item._id}
              id={item.productId._id}
              image={item.productId.image}
              name={item.productId.name}
              price={item.productId.price}
              discount={item.productId.discount}
              discountActive={item.productId.discountActive}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default Wishlist