import React, { useEffect, useState, useContext } from 'react'
import { assets } from '../assets/assets'
import Title from '../components/Title'
import ProductItem from '../components/ProductItem'
import { ShopContext } from '../context/ShopContext'
import { toast } from 'react-toastify'
import { useLocation } from 'react-router-dom'

const Collection = () => {
  const { products, search, showSearch, token, navigate, searchProductsAdvanced } = useContext(ShopContext)
  const [showFilter, setShowFilter] = useState(false)
  const [filterproducts, setFilterProducts] = useState([])
  const [category, setCategory] = useState([])
  const [subCategory, setSubCategory] = useState([])
  const [selectedCollection, setSelectedCollection] = useState('')
  const [selectedBrands, setSelectedBrands] = useState([])
  const [selectedSizes, setSelectedSizes] = useState([])
  const [selectedColors, setSelectedColors] = useState([])
  const [priceMin, setPriceMin] = useState('')
  const [priceMax, setPriceMax] = useState('')
  const [minRating, setMinRating] = useState('')
  const [sortType, setSortType] = useState('relevant')
  const [failedLogos, setFailedLogos] = useState({})
  const location = useLocation()

  // URL থেকে collection parameter নাও
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const col = params.get('collection')
    if (col) setSelectedCollection(col)
  }, [location.search])

  const toggleCategory = (e) => {
    if (category.includes(e.target.value)) {
      setCategory(prev => prev.filter(item => item !== e.target.value))
    } else {
      setCategory(prev => [...prev, e.target.value])
    }
  }

  const toggleSubCategory = (e) => {
    if (subCategory.includes(e.target.value)) {
      setSubCategory(prev => prev.filter(item => item !== e.target.value))
    } else {
      setSubCategory(prev => [...prev, e.target.value])
    }
  }

  const toggleArrayValue = (value, setter) => {
    setter((prev) => (prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]))
  }

  const applyFilter = async () => {
    const hasActiveSearchOrFilters = Boolean(
      (showSearch && search) ||
      category.length ||
      subCategory.length ||
      selectedBrands.length ||
      selectedSizes.length ||
      selectedColors.length ||
      priceMin ||
      priceMax ||
      minRating ||
      selectedCollection ||
      sortType !== 'relevant'
    )

    const apiProducts = await searchProductsAdvanced({
      q: showSearch ? search : '',
      category: category.length === 1 ? category[0] : '',
      subCategory: subCategory.length === 1 ? subCategory[0] : '',
      brands: selectedBrands,
      colors: selectedColors,
      sizes: selectedSizes,
      minPrice: priceMin,
      maxPrice: priceMax,
      minRating,
      sort: sortType === 'relevant' ? 'relevance' : sortType === 'rating' ? 'rating-desc' : sortType === 'low-high' ? 'price-asc' : 'price-desc'
    })

    let productsCopy = hasActiveSearchOrFilters ? apiProducts : products.slice()

    if (!selectedCollection) {
      productsCopy = productsCopy.filter((item) => item.showInCollection)
    }

    if (selectedCollection) {
      productsCopy = productsCopy.filter((item) => item.collections && item.collections.includes(selectedCollection))
    }

    if (category.length > 1) {
      productsCopy = productsCopy.filter((item) => category.includes(item.category))
    }

    if (subCategory.length > 1) {
      productsCopy = productsCopy.filter((item) => subCategory.includes(item.subCategory))
    }

    setFilterProducts(productsCopy)
  }

  useEffect(() => {
    applyFilter()
  }, [
    category,
    subCategory,
    search,
    showSearch,
    products,
    selectedCollection,
    selectedBrands,
    selectedSizes,
    selectedColors,
    priceMin,
    priceMax,
    minRating,
    sortType
  ])

  useEffect(() => {
    if (!token) {
      const timer = setTimeout(() => {
        navigate('/login')
        toast.info('Please login to continue shopping 😊')
      }, 60000)
      return () => clearTimeout(timer)
    }
  }, [token])

  const COLLECTIONS = [
    { value: '', label: 'All', short: 'A' },
    { value: 'latest', label: 'Latest', logoSrc: assets.latest_logo, short: 'L' },
    { value: 'jacket', label: 'Jacket', logoSrc: assets.jacket_logo, short: 'J' },
    { value: 'bloop', label: 'Bloop', logoSrc: assets.logo, short: 'B' },
    { value: 'bestseller', label: 'Bestseller', logoSrc: assets.bestseller_logo, short: 'BS' },
    { value: 'boss', label: 'Boss', logoSrc: assets.boss_logo, short: 'BO' },
    { value: 'lacoste', label: 'Lacoste', logoSrc: assets.lacoste_logo, short: 'LA' },
    { value: 'ralph-lauren', label: 'Ralph Lauren', logoSrc: assets.ralph_lauren_logo, short: 'RL' },
  ]

  const availableBrands = [...new Set(products.map((item) => item.brand).filter(Boolean))]
  const availableSizes = [...new Set(products.flatMap((item) => item.sizes || []))]
  const availableColors = [...new Set(products.flatMap((item) => item.colors || []))]

  return (
    <div className='flex flex-col sm:flex-row gap-1 sm:gap-10 pt-10 border-t'>
      {/* filter options */}
      <div className='min-w-60'>
        <p onClick={() => setShowFilter(!showFilter)} className='my-2 text-xl flex items-center cursor-pointer gap-2'>
          FILTERS
          <img className={`h-3 sm:hidden ${showFilter ? 'rotate-90' : ''}`} src={assets.dropdown_icon} alt="" />
        </p>

        {/* Collection Filter */}
        <div className={`border border-gray-300 pl-5 py-3 mt-6 ${showFilter ? '' : 'hidden'} sm:block`}>
          <p className='mb-3 text-sm font-medium'>COLLECTIONS</p>
          <div className='flex flex-col gap-2 text-sm font-light text-gray-700'>
            {COLLECTIONS.map(col => (
              <p
                key={col.value}
                onClick={() => setSelectedCollection(col.value)}
                className={`cursor-pointer px-2 py-1 rounded transition flex items-center gap-2 ${selectedCollection === col.value ? 'bg-black text-white' : 'hover:bg-gray-100'}`}
              >
                {col.logoSrc && !failedLogos[col.value] ? (
                  <img
                    src={col.logoSrc}
                    alt={col.label}
                    className='w-4 h-4 object-contain rounded-sm'
                    onError={() => setFailedLogos(prev => ({ ...prev, [col.value]: true }))}
                  />
                ) : (
                  <span className='w-4 h-4 rounded-sm bg-gray-200 text-[9px] flex items-center justify-center text-gray-700'>
                    {col.short}
                  </span>
                )}
                {col.label}
              </p>
            ))}
          </div>
        </div>

        {/* Category Filter */}
        <div className={`border border-gray-300 pl-5 py-3 mt-4 ${showFilter ? '' : 'hidden'} sm:block`}>
          <p className='mb-3 text-sm font-medium'>CATEGORIES</p>
          <div className='flex flex-col gap-2 text-sm font-light text-gray-700'>
            <p className='flex gap-2'>
              <input className='w-3' type="checkbox" value={'Men'} onChange={toggleCategory} /> Men
            </p>
            <p className='flex gap-2'>
              <input className='w-3' type="checkbox" value={'Women'} onChange={toggleCategory} /> Women
            </p>
            <p className='flex gap-2'>
              <input className='w-3' type="checkbox" value={'Kids'} onChange={toggleCategory} /> Kids
            </p>
          </div>
        </div>

        {/* SubCategory Filter */}
        <div className={`border border-gray-300 pl-5 py-3 my-5 ${showFilter ? '' : 'hidden'} sm:block`}>
          <p className='mb-3 text-sm font-medium'>TYPE</p>
          <div className='flex flex-col gap-2 text-sm font-light text-gray-700'>
            <p className='flex gap-2'>
              <input className='w-3' type="checkbox" value={'Topwear'} onChange={toggleSubCategory} /> Topwear
            </p>
            <p className='flex gap-2'>
              <input className='w-3' type="checkbox" value={'Bottomwear'} onChange={toggleSubCategory} /> Bottomwear
            </p>
            <p className='flex gap-2'>
              <input className='w-3' type="checkbox" value={'Winterwear'} onChange={toggleSubCategory} /> Winterwear
            </p>
          </div>
        </div>

        <div className={`border border-gray-300 pl-5 py-3 my-5 ${showFilter ? '' : 'hidden'} sm:block`}>
          <p className='mb-3 text-sm font-medium'>PRICE RANGE</p>
          <div className='flex gap-2 pr-4'>
            <input
              type='number'
              value={priceMin}
              onChange={(e) => setPriceMin(e.target.value)}
              placeholder='Min'
              className='w-full border px-2 py-1 text-sm'
            />
            <input
              type='number'
              value={priceMax}
              onChange={(e) => setPriceMax(e.target.value)}
              placeholder='Max'
              className='w-full border px-2 py-1 text-sm'
            />
          </div>
        </div>

        <div className={`border border-gray-300 pl-5 py-3 my-5 ${showFilter ? '' : 'hidden'} sm:block`}>
          <p className='mb-3 text-sm font-medium'>RATING</p>
          <select
            value={minRating}
            onChange={(e) => setMinRating(e.target.value)}
            className='border px-2 py-1 text-sm mr-4'
          >
            <option value=''>Any</option>
            <option value='4'>4+ stars</option>
            <option value='3'>3+ stars</option>
            <option value='2'>2+ stars</option>
          </select>
        </div>

        {availableBrands.length > 0 && (
          <div className={`border border-gray-300 pl-5 py-3 my-5 ${showFilter ? '' : 'hidden'} sm:block`}>
            <p className='mb-3 text-sm font-medium'>BRAND</p>
            <div className='flex flex-col gap-2 text-sm font-light text-gray-700'>
              {availableBrands.slice(0, 10).map((brand) => (
                <label key={brand} className='flex gap-2'>
                  <input
                    className='w-3'
                    type='checkbox'
                    checked={selectedBrands.includes(brand)}
                    onChange={() => toggleArrayValue(brand, setSelectedBrands)}
                  />
                  {brand}
                </label>
              ))}
            </div>
          </div>
        )}

        {availableSizes.length > 0 && (
          <div className={`border border-gray-300 pl-5 py-3 my-5 ${showFilter ? '' : 'hidden'} sm:block`}>
            <p className='mb-3 text-sm font-medium'>SIZE</p>
            <div className='flex flex-wrap gap-2 pr-4'>
              {availableSizes.map((size) => (
                <button
                  type='button'
                  key={size}
                  onClick={() => toggleArrayValue(size, setSelectedSizes)}
                  className={`px-2 py-1 border text-xs ${selectedSizes.includes(size) ? 'bg-black text-white' : 'bg-white'}`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>
        )}

        {availableColors.length > 0 && (
          <div className={`border border-gray-300 pl-5 py-3 my-5 ${showFilter ? '' : 'hidden'} sm:block`}>
            <p className='mb-3 text-sm font-medium'>COLOR</p>
            <div className='flex flex-wrap gap-2 pr-4'>
              {availableColors.slice(0, 12).map((color) => (
                <button
                  type='button'
                  key={color}
                  onClick={() => toggleArrayValue(color, setSelectedColors)}
                  className={`px-2 py-1 border text-xs rounded ${selectedColors.includes(color) ? 'bg-black text-white' : 'bg-white'}`}
                >
                  {color}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* right side */}
      <div className='flex-1'>
        <div className='flex justify-between text-base sm:text-2xl mb-4'>
          <Title
            text1={selectedCollection ? selectedCollection.toUpperCase() : 'ALL'}
            text2={'COLLECTIONS'}
          />
          <select onChange={(e) => setSortType(e.target.value)} className='border-2 border-gray-300 text-sm px-2'>
            <option value="relevant">sort by: Relevant</option>
            <option value="low-high">sort by: Low to High</option>
            <option value="high-low">sort by: High to Low</option>
            <option value="rating">sort by: Top Rated</option>
          </select>
        </div>

        {filterproducts.length === 0 ? (
          <div className='text-center py-20 text-gray-400'>
            <p className='text-lg'>No products found in this collection!</p>
          </div>
        ) : (
          <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 gap-y-6'>
            {filterproducts.map((item) => (
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
        )}
      </div>
    </div>
  )
}

export default Collection