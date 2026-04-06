import axios from 'axios';
import React, { useEffect, useState } from 'react'
import { bakendUrl, currency } from '../App';
import { toast } from 'react-toastify';
import { FaTrash, FaTag, FaStore } from 'react-icons/fa'

const COLLECTIONS = [
  { value: 'latest', label: 'Latest' },
  { value: 'polo', label: 'Polo' },
  { value: 'jacket', label: 'Jacket' },
  { value: 'bloop', label: 'Bloop' },
  { value: 'bestseller', label: 'Bestseller' },
]

const List = ({ token }) => {
  const [list, setList] = useState([]);

  const fetchList = async () => {
    try {
      const response = await axios.get(bakendUrl + '/api/product/list');
      if (response.data.success) {
        setList(response.data.Products);
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.log(error)
      toast.error(error.message)
    }
  }

  const removeProduct = async (id) => {
    try {
      const response = await axios.post(bakendUrl + '/api/product/remove', { id }, { headers: { token } })
      if (response.data.success) {
        toast.success(response.data.message)
        await fetchList();
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.log(error);
      toast.error(error.message);
    }
  }

  const toggleDiscount = async (item) => {
    try {
      const response = await axios.post(bakendUrl + '/api/product/update-discount', {
        productId: item._id,
        discount: item.discount || 0,
        discountActive: !item.discountActive
      }, { headers: { token } })
      if (response.data.success) {
        toast.success(`Discount ${!item.discountActive ? 'activated' : 'deactivated'}!`)
        await fetchList()
      } else {
        toast.error(response.data.message)
      }
    } catch (error) {
      toast.error(error.message)
    }
  }

  const updateDiscountValue = async (item, newDiscount) => {
    try {
      const response = await axios.post(bakendUrl + '/api/product/update-discount', {
        productId: item._id,
        discount: Number(newDiscount),
        discountActive: item.discountActive
      }, { headers: { token } })
      if (response.data.success) {
        toast.success('Discount updated!')
        await fetchList()
      } else {
        toast.error(response.data.message)
      }
    } catch (error) {
      toast.error(error.message)
    }
  }

  const toggleCollection = async (item, collectionValue) => {
    const currentCollections = item.collections || []
    const newCollections = currentCollections.includes(collectionValue)
      ? currentCollections.filter(c => c !== collectionValue)
      : [...currentCollections, collectionValue]

    try {
      const response = await axios.post(bakendUrl + '/api/product/update-collection', {
        productId: item._id,
        collections: newCollections,
        showInCollection: item.showInCollection
      }, { headers: { token } })
      if (response.data.success) {
        toast.success('Collection updated!')
        await fetchList()
      } else {
        toast.error(response.data.message)
      }
    } catch (error) {
      toast.error(error.message)
    }
  }

  const toggleShowInCollection = async (item) => {
    try {
      const response = await axios.post(bakendUrl + '/api/product/update-collection', {
        productId: item._id,
        collections: item.collections || [],
        showInCollection: !item.showInCollection
      }, { headers: { token } })
      if (response.data.success) {
        toast.success(`Collection page: ${!item.showInCollection ? 'Shown' : 'Hidden'}!`)
        await fetchList()
      } else {
        toast.error(response.data.message)
      }
    } catch (error) {
      toast.error(error.message)
    }
  }

  useEffect(() => {
    fetchList();
  }, [])

  return (
    <>
      <p className='mb-2 text-lg font-semibold'>All Products List</p>
      <div className='flex flex-col gap-2'>

        {/* Table Header */}
        <div className='hidden md:grid grid-cols-[1fr_2fr_1fr_1fr_1fr_1fr_1fr_1fr] items-center py-1 px-2 border bg-gray-100 text-sm'>
          <b>Image</b>
          <b>Name</b>
          <b>Category</b>
          <b>Price</b>
          <b>Discount</b>
          <b>Collections</b>
          <b>Show</b>
          <b className='text-center'>Delete</b>
        </div>

        {/* Product List */}
        {list.map((item, index) => (
          <div className='grid grid-cols-[1fr_2fr_1fr] md:grid-cols-[1fr_2fr_1fr_1fr_1fr_1fr_1fr_1fr] items-center py-2 px-2 border bg-gray-50 text-sm gap-2' key={index}>

            {/* Image */}
            <img className='w-12 h-12 object-cover' src={item.image[0]} alt="" />

            {/* Name */}
            <div>
              <p className='font-medium text-xs'>{item.name}</p>
              {item.collections && item.collections.length > 0 && (
                <div className='flex flex-wrap gap-1 mt-1'>
                  {item.collections.map(c => (
                    <span key={c} className='bg-black text-white text-xs px-1 rounded'>{c}</span>
                  ))}
                </div>
              )}
            </div>

            {/* Category */}
            <p className='text-xs'>{item.category}</p>

            {/* Price */}
            <div>
              <p className='text-xs'>{currency}{item.price}</p>
              {item.discountActive && item.discount > 0 && (
                <p className='text-green-600 text-xs'>{currency}{(item.price - (item.price * item.discount / 100)).toFixed(2)}</p>
              )}
            </div>

            {/* Discount */}
            <div className='flex items-center gap-1'>
              <input
                type='number'
                min='0'
                max='100'
                defaultValue={item.discount || 0}
                className='w-12 px-1 py-0.5 border text-xs'
                onBlur={(e) => {
                  if (Number(e.target.value) !== item.discount) {
                    updateDiscountValue(item, e.target.value)
                  }
                }}
              />
              <span className='text-xs'>%</span>
              <div
                onClick={() => toggleDiscount(item)}
                className={`w-8 h-4 rounded-full cursor-pointer transition-all ${item.discountActive ? 'bg-green-500' : 'bg-gray-300'}`}
              >
                <div className={`w-4 h-4 bg-white rounded-full shadow transition-all ${item.discountActive ? 'translate-x-4' : 'translate-x-0'}`}></div>
              </div>
            </div>

            {/* Collections Toggle */}
            <div className='flex flex-wrap gap-1'>
              {COLLECTIONS.map(col => (
                <div
                  key={col.value}
                  onClick={() => toggleCollection(item, col.value)}
                  className={`text-xs px-1.5 py-0.5 rounded cursor-pointer border transition ${(item.collections || []).includes(col.value)
                    ? 'bg-black text-white border-black'
                    : 'bg-white text-gray-500 border-gray-300 hover:border-black'
                    }`}
                >
                  {col.label}
                </div>
              ))}
            </div>

            {/* Show in Collection Page */}
            <div className='flex items-center gap-1'>
              <div
                onClick={() => toggleShowInCollection(item)}
                className={`w-8 h-4 rounded-full cursor-pointer transition-all ${item.showInCollection ? 'bg-blue-500' : 'bg-gray-300'}`}
              >
                <div className={`w-4 h-4 bg-white rounded-full shadow transition-all ${item.showInCollection ? 'translate-x-4' : 'translate-x-0'}`}></div>
              </div>
              <span className='text-xs text-gray-500'>{item.showInCollection ? 'On' : 'Off'}</span>
            </div>

            {/* Delete */}
            <p onClick={() => removeProduct(item._id)} className='text-center cursor-pointer text-red-500'>
              <FaTrash />
            </p>
          </div>
        ))}
      </div>
    </>
  )
}

export default List