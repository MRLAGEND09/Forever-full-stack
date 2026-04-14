import React, { useContext, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom';
import { assets } from '../assets/assets';
import RelatedProducts from '../components/RelatedProducts';
import ReviewSection from '../components/ReviewSection';
import { ShopContext } from '../context/ShopContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import Auto3DPreview from '../components/Auto3DPreview';
import UserTryOn from '../components/UserTryOn';
import FeatureErrorBoundary from '../components/FeatureErrorBoundary';

const Product = () => {

  const { Productid } = useParams();
  const { products, currency, addToCart, trackProductView, token, backendUrl, convertPrice } = useContext(ShopContext);
  const [productData, setProductData] = useState(false);
  const [image, setImage] = useState('')
  const [size, setSize] = useState('')
  const [sizeHint, setSizeHint] = useState(null)

  const fetchProductData = async () => {
    const matched = products.find((item) => item._id === Productid)
    if (matched) {
      setProductData(matched)
      setImage(matched.image[0])
      return
    }

    try {
      const response = await axios.post(backendUrl + '/api/product/single', { productId: Productid })
      if (response.data.success && response.data.product) {
        setProductData(response.data.product)
        setImage(response.data.product.image?.[0] || '')
      }
    } catch (error) {
      console.log(error)
    }
  }

  useEffect(() => {
    fetchProductData();
  }, [Productid, products])

  useEffect(() => {
    if (productData?._id) {
      trackProductView(productData._id)
    }
  }, [productData?._id])

  useEffect(() => {
    const loadSizeHint = async () => {
      if (!token || !productData?._id) return
      try {
        const response = await axios.post(backendUrl + '/api/product/size-recommendation', { productId: productData._id }, { headers: { token } })
        if (response.data.success) {
          setSizeHint(response.data)
        }
      } catch (error) {
        console.log(error)
      }
    }

    loadSizeHint()
  }, [token, productData?._id])

  const shareProduct = async () => {
    if (!token || !productData?._id) {
      toast.error('Please login to create affiliate share links')
      return
    }
    try {
      const response = await axios.post(backendUrl + '/api/product/affiliate-link', { productId: productData._id }, { headers: { token } })
      if (response.data.success) {
        await navigator.clipboard.writeText(response.data.shareUrl)
        toast.success('Affiliate product link copied')
      }
    } catch (error) {
      toast.error('Could not create share link')
    }
  }

  const discountedPrice = productData && productData.discountActive && productData.discount > 0
    ? (productData.price - (productData.price * productData.discount / 100)).toFixed(2)
    : null

  return productData ? (
    <div className='border-t-2 pt-10 transition-opacity ease-in duration-500 opacity-100'>
      {/*------ product data -----*/}
      <div className='flex gap-12 sm:gap-12 flex-col sm:flex-row'>

        {/*------ product images ------ */}
        <div className='flex-1 flex flex-col-reverse gap-3 sm:flex-row'>
          <div className='flex sm:flex-col overflow-x-auto sm:overflow-y-scroll justify-between sm:justify-normal sm:w-[18.7%] w-full'>
            {productData.image.map((item, index) => (
              <img onClick={() => setImage(item)} src={item} key={`${item}-${index}`} className='w-[24%] sm:w-full sm:mb-3 flex-shrink-0 cursor-pointer' alt="" />
            ))}
          </div>
          <div className='w-full sm:w-[80%] relative'>
            <img className='w-full h-auto' src={image} alt="" />
            {productData.discountActive && productData.discount > 0 && (
              <span className='absolute top-3 left-3 bg-red-500 text-white text-sm px-3 py-1 rounded'>
                {productData.discount}% OFF
              </span>
            )}
          </div>
        </div>

        {/* ------ product info ------ */}
        <div className='flex-1'>
          <h1 className='font-medium text-2xl mt-2'>{productData.name}</h1>
          <div className='flex items-center gap-1 mt-2'>
            {Array.from({ length: 5 }, (_, i) => (
              <img
                key={i}
                src={i < Math.floor(productData.rating || 0) ? assets.star_icon : assets.star_dull_icon}
                alt=""
                className="w-3.5"
              />
            ))}
            <p className='pl-2'>({productData.reviewCount || 0})</p>
          </div>

          {/* Price with discount */}
          {discountedPrice ? (
            <div className='mt-5 flex items-center gap-3'>
              <p className='text-3xl font-medium text-red-500'>{currency}{convertPrice(discountedPrice)}</p>
              <p className='text-xl text-gray-400 line-through'>{currency}{convertPrice(productData.price)}</p>
              <span className='bg-red-100 text-red-500 text-sm px-2 py-1 rounded'>
                Save {currency}{convertPrice(productData.price - discountedPrice)}
              </span>
            </div>
          ) : (
            <p className='mt-5 text-3xl font-medium'>{currency}{convertPrice(productData.price)}</p>
          )}

          <p className='mt-5 text-gray-500 md:w-4/5'>{productData.description}</p>
          <div className='flex flex-col gap-4 my-8'>
            <p>Select Size</p>
            {sizeHint?.recommendedSize && (
              <p className='text-sm text-green-600'>
                Recommended size: <b>{sizeHint.recommendedSize}</b> ({sizeHint.confidence}% confidence)
              </p>
            )}
            <div className='flex gap-2'>
              {productData.sizes.map((item, index) => (
                <button onClick={() => setSize(item)} className={`border py-2 px-4 bg-gray-100 ${item === size ? 'border-orange-500' : ''}`} key={`${item}-${index}`}>{item}</button>
              ))}
            </div>
          </div>
          <div className='flex items-center gap-3'>
            <button onClick={() => addToCart(productData._id, size)} className='bg-black text-white px-8 py-3 text-sm active:bg-gray-700'>ADD TO CART</button>
            <button onClick={shareProduct} className='border px-4 py-3 text-sm'>Share + Earn</button>
          </div>

          <FeatureErrorBoundary>
            <Auto3DPreview images={productData.image} />
          </FeatureErrorBoundary>

          <FeatureErrorBoundary>
            <UserTryOn
              productImage={image || productData.image?.[0]}
              productImages={productData.image || []}
              productName={productData.name || ''}
              productCategory={productData.category || ''}
              productSubCategory={productData.subCategory || ''}
            />
          </FeatureErrorBoundary>

          {(productData.model3dUrl || productData.virtualTryOnUrl || productData.arSceneUrl) && (
            <div className='mt-4 border p-4 rounded bg-gray-50'>
              <p className='font-medium mb-3'>Advanced AR & VR Links</p>
              {productData.model3dUrl && (
                <a href={productData.model3dUrl} target='_blank' rel='noreferrer' className='text-sm text-blue-600 underline block mb-2'>Open Real 3D Model</a>
              )}
              {productData.virtualTryOnUrl && (
                <a href={productData.virtualTryOnUrl} target='_blank' rel='noreferrer' className='text-sm text-blue-600 underline block mb-2'>Open Virtual Try-On</a>
              )}
              {productData.arSceneUrl && (
                <a href={productData.arSceneUrl} target='_blank' rel='noreferrer' className='text-sm text-blue-600 underline block'>Open AR Room Planner</a>
              )}
            </div>
          )}
          <hr className='mt-8 sm:w-4/5' />
          <div className='text-sm text-gray-500 mt-5 flex flex-col gap-1'>
            <p>100% Original product.</p>
            <p>Cash on Delivery is availble on this product.</p>
            <p>Easy return and exchange policy within 7 days.</p>
          </div>
        </div>
      </div>

      {/* ------- Description & Review Section ------ */}
      <ReviewSection productId={productData._id} />

      {/* ------ Display Related Products ------ */}
      <RelatedProducts category={productData.category} subCategory={productData.subCategory} productId={productData._id} />

    </div>
  ) : <div className='opacity-0'></div>
}

export default Product