import React, { useEffect, useState } from 'react'
import { useContext } from 'react'
import { assets } from '../assets/assets';
import Titel from '../components/Titel';
import ProductItem from '../components/ProductItem';
import { ShopContext } from '../Context/ShopContext';


const Collection = () => {

  const { products ,search ,showSearch } = useContext(ShopContext);
  const [showFilter,setshowFilter] = useState(false);
  const [filterproducts,setfilterproducts] = useState([]);
  const [category,setcategory] = useState([]);
  const [subCategory,setsubCategory] = useState([]);
  const [sortType,setsortType] = useState('relavent')

  const togglecategory = (e) =>{

    if (category.includes(e.target.value)) {
      setcategory(prev=> prev.filter(item => item !== e.target.value))
    }
    else{
      setcategory(prev=> [...prev,e.target.value])
    }
  }

  const togglesubCategory = (e) =>{

    if (subCategory.includes(e.target.value)) {
      setsubCategory(prev=> prev.filter(item => item !== e.target.value))
    }
    else{
      setsubCategory(prev=> [...prev,e.target.value])
    }
  }

  const applyFilter = () => {

    let productsCopy = products.slice();

    if (showSearch && search) {
      productsCopy = productsCopy.filter(item => item.name.toLowerCase().includes(search.toLowerCase()))
    }

    if (category.length > 0) {
      productsCopy = productsCopy.filter(item => category.includes(item.category));
    }
    if (subCategory.length > 0) {
      productsCopy = productsCopy.filter(item => subCategory.includes(item.subCategory));
    }
    setfilterproducts(productsCopy)
  }

  const sortproducts = () =>{

    let fpCopy = filterproducts.slice();

    switch (sortType) {
      case 'low-high':
        setfilterproducts(fpCopy.sort((a,b)=>(a.price - b.price)));
        break;

      case 'high-low':
        setfilterproducts(fpCopy.sort((a,b)=>(b.price - a.price)));
        break;

      default:
        applyFilter();
        break;
    }

  }

  useEffect(()=>{
     applyFilter();
  },[category,subCategory,search,showSearch,products])

  useEffect(()=>{
    sortproducts();
  },[sortType])

  return (
    <div className='flex flex-col sm:flex-row gap-1 sm:gap-10 pt-10 border-t'>
      
      {/* filter options */}
      <div className='min-w-60'>
        <p onClick={()=>setshowFilter(!showFilter)} className='my-2 text-xl flex items-center cursor-pointer gap-2'>FILTERS
          <img className={`h-3 sm:hidden ${showFilter ? 'rotate-90' : ''}`} src={assets.dropdown_icon} alt="" />
        </p>
        {/* category filter */}
        <div className={`border border-gray-300 pl-5 py-3 mt-6 ${showFilter ? '' :'hidden'} sm:block`}>
          <p className='md-3 text-sm font-medium'>CATEGORIES</p>
          <div className='flex flex-col gap-2 text-sm font-light text-gray-700'>
            <p className='flex gap-2'>
            <input className='w-3' type="checkbox" value={'Men'} onChange={togglecategory}/> Men
            </p>
            <p className='flex gap-2'>
            <input className='w-3' type="checkbox" value={'Women'} onChange={togglecategory}/> Women
            </p>
            <p className='flex gap-2'>
            <input className='w-3' type="checkbox" value={'Kids'} onChange={togglecategory}/> Kids
            </p>
          </div>
        </div>
        {/* subcategory filter */}
        <div className={`border border-gray-300 pl-5 py-3 my-5 ${showFilter ? '' :'hidden'} sm:block`}>
          <p className='md-3 text-sm font-medium'>TYPE</p>
          <div className='flex flex-col gap-2 text-sm font-light text-gray-700'>
            <p className='flex gap-2'>
            <input className='w-3' type="checkbox" value={'Topwear'} onChange={togglesubCategory}/> Topwear
            </p>
            <p className='flex gap-2'>
            <input className='w-3' type="checkbox" value={'Bottomwear'} onChange={togglesubCategory}/> Bottomwear
            </p>
            <p className='flex gap-2'>
            <input className='w-3' type="checkbox" value={'Winterwear'} onChange={togglesubCategory}/> Winterwear
            </p>
          </div>
        </div>
      </div>

      {/* right side */}
      <div className='flex-1'>

        <div className='flex justify-between text-base sm:text-2xl mb-4'>
           <Titel text1={'ALL'} text2={'COLLECTIONS'}/>
           {/* PRODUCT SORT */}
           <select onChange={(e)=>setsortType(e.target.value)} className='border-2 border-gray-300 text-sm px-2'>
            <option value="relavent">sort by: Relavent</option>
            <option value="low-high">sort by: Low to High</option>
            <option value="high-low">sort by: high to low</option>
           </select>
        </div>

        {/* map products */}
        <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 gap-y-6'>
          {
            filterproducts.map((item,index)=>(
              <ProductItem key={index} id={item._id} image={item.image} name={item.name} price={item.price} />
            ))
          }
        </div>

      </div>

    </div>
  )
}

export default Collection
