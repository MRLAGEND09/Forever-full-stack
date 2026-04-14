import React, { useState } from 'react'
import { assets } from '../assets/assets'
import axios from 'axios';
import { bakendUrl } from '../App';
import { toast } from 'react-toastify';
import { FaLeaf, FaCrown } from 'react-icons/fa'
import { SiZara, SiDior, SiNike, SiHugo } from 'react-icons/si'

const COLLECTIONS = [
  { value: 'latest', label: 'Latest Collection', logoSrc: assets.latest_logo, Icon: SiZara },
  { value: 'jacket', label: 'Jacket Collection', logoSrc: assets.jacket_logo, Icon: SiDior },
  { value: 'bloop', label: 'Bloop Collection', logoSrc: assets.logo },
  { value: 'bestseller', label: 'Bestseller Collection', logoSrc: assets.bestseller_logo, Icon: SiNike },
  { value: 'boss', label: 'Boss Collection', logoSrc: assets.boss_logo, Icon: SiHugo },
  { value: 'lacoste', label: 'Lacoste Collection', logoSrc: assets.lacoste_logo, Icon: FaLeaf },
  { value: 'ralph-lauren', label: 'Ralph Lauren Collection', logoSrc: assets.ralph_lauren_logo, Icon: FaCrown },
]

const Add = ({ token }) => {
  const [image1, setImage1] = useState(null);
  const [image2, setImage2] = useState(null);
  const [image3, setImage3] = useState(null);
  const [image4, setImage4] = useState(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [brand, setBrand] = useState('')
  const [colors, setColors] = useState('')
  const [stock, setStock] = useState(20)
  const [reorderThreshold, setReorderThreshold] = useState(5)
  const [reorderQuantity, setReorderQuantity] = useState(20)
  const [regions, setRegions] = useState(['global'])
  const [model3dUrl, setModel3dUrl] = useState('')
  const [virtualTryOnUrl, setVirtualTryOnUrl] = useState('')
  const [arSceneUrl, setArSceneUrl] = useState('')
  const [Category, setCategory] = useState("Men");
  const [subCategory, setSubCategory] = useState("Topwear");
  const [bestseller, setBestseller] = useState(false);
  const [sizes, setSizes] = useState([]);
  const [selectedCollections, setSelectedCollections] = useState([]);
  const [showInCollection, setShowInCollection] = useState(false);
  const [failedLogos, setFailedLogos] = useState({});

  const toggleCollection = (value) => {
    setSelectedCollections(prev =>
      prev.includes(value)
        ? prev.filter(c => c !== value)
        : [...prev, value]
    )
  }

  const onSubmitHandler = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();

      formData.append("name", name);
      formData.append("description", description);
      formData.append("price", Number(price));
      formData.append("category", Category);
      formData.append("subCategory", subCategory);
      formData.append("brand", brand);
      formData.append("colors", JSON.stringify(colors.split(',').map((item) => item.trim()).filter(Boolean)));
      formData.append("bestseller", bestseller.toString());
      formData.append("sizes", JSON.stringify(sizes));
      formData.append("collections", JSON.stringify(selectedCollections));
      formData.append("showInCollection", showInCollection.toString());
      formData.append("stock", Number(stock));
      formData.append("reorderThreshold", Number(reorderThreshold));
      formData.append("reorderQuantity", Number(reorderQuantity));
      formData.append("regions", JSON.stringify(regions));
      formData.append("model3dUrl", model3dUrl);
      formData.append("virtualTryOnUrl", virtualTryOnUrl);
      formData.append("arSceneUrl", arSceneUrl);

      image1 && formData.append("image1", image1);
      image2 && formData.append("image2", image2);
      image3 && formData.append("image3", image3);
      image4 && formData.append("image4", image4);

      const response = await axios.post(bakendUrl + "/api/product/add", formData, { headers: { token } })

      if (response.data.success) {
        toast.success(response.data.message)
        setName('')
        setDescription('')
        setImage1(null)
        setImage2(null)
        setImage3(null)
        setImage4(null)
        setPrice('')
        setSelectedCollections([])
        setShowInCollection(false)
        setBestseller(false)
        setSizes([])
        setBrand('')
        setColors('')
        setStock(20)
        setReorderThreshold(5)
        setReorderQuantity(20)
        setRegions(['global'])
        setModel3dUrl('')
        setVirtualTryOnUrl('')
        setArSceneUrl('')
      } else {
        toast.error(response.data.message)
      }
    } catch (error) {
      console.log(error);
      toast.error(error.message)
    }
  };

  return (
    <form onSubmit={onSubmitHandler} className='flex flex-col w-full items-start gap-3'>
      <div>
        <p className='mb-2'>Upload Image</p>
        <div className='flex gap-2'>
          <label htmlFor="image1">
            <img className='w-20' src={!image1 ? assets.upload_area : URL.createObjectURL(image1)} alt="" />
            <input onChange={(e) => setImage1(e.target.files[0])} type="file" id="image1" hidden />
          </label>
          <label htmlFor="image2">
            <img className='w-20' src={!image2 ? assets.upload_area : URL.createObjectURL(image2)} alt="" />
            <input onChange={(e) => setImage2(e.target.files[0])} type="file" id="image2" hidden />
          </label>
          <label htmlFor="image3">
            <img className='w-20' src={!image3 ? assets.upload_area : URL.createObjectURL(image3)} alt="" />
            <input onChange={(e) => setImage3(e.target.files[0])} type="file" id="image3" hidden />
          </label>
          <label htmlFor="image4">
            <img className='w-20' src={!image4 ? assets.upload_area : URL.createObjectURL(image4)} alt="" />
            <input onChange={(e) => setImage4(e.target.files[0])} type="file" id="image4" hidden />
          </label>
        </div>
      </div>

      <div className='w-full'>
        <p className='mb-2'>Product Name</p>
        <input onChange={(e) => setName(e.target.value)} value={name} className='w-full max-w-[500px] px-3 py-2' type="text" placeholder='type here' required />
      </div>

      <div className='w-full'>
        <p className='mb-2'>Product description</p>
        <textarea onChange={(e) => setDescription(e.target.value)} value={description} className='w-full max-w-[500px] px-3 py-2' type="text" placeholder='write content here' required />
      </div>

      <div className='w-full max-w-[500px] grid grid-cols-1 sm:grid-cols-2 gap-3'>
        <input onChange={(e) => setBrand(e.target.value)} value={brand} className='px-3 py-2 border' type='text' placeholder='Brand (optional)' />
        <input onChange={(e) => setColors(e.target.value)} value={colors} className='px-3 py-2 border' type='text' placeholder='Colors comma separated' />
      </div>

      <div className='flex flex-col sm:flex-row gap-2 w-full sm:gap-8'>
        <div>
          <p className='mb-2'>Product Category</p>
          <select onChange={(e) => setCategory(e.target.value)} className='w-full px-3 py-2'>
            <option value="Men">Men</option>
            <option value="Women">Women</option>
            <option value="Kids">Kids</option>
          </select>
        </div>

        <div>
          <p className='mb-2'>Sub Category</p>
          <select onChange={(e) => setSubCategory(e.target.value)} className='w-full px-3 py-2'>
            <option value="Topwear">Topwear</option>
            <option value="Bottomwear">Bottomwear</option>
            <option value="Winterwear">Winterwear</option>
          </select>
        </div>

        <div>
          <p className='mb-2'>Product Price</p>
          <input onChange={(e) => setPrice(e.target.value)} value={price} className='w-full px-3 py-2 sm:w-[120px]' type="Number" placeholder='25' />
        </div>
        <div>
          <p className='mb-2'>Stock</p>
          <input onChange={(e) => setStock(e.target.value)} value={stock} className='w-full px-3 py-2 sm:w-[120px]' type='number' min='0' />
        </div>
      </div>

      <div className='w-full max-w-[500px]'>
        <p className='mb-2'>Inventory Rules</p>
        <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
          <div>
            <p className='text-xs text-gray-600 mb-1'>Low Stock Alert Threshold</p>
            <input onChange={(e) => setReorderThreshold(e.target.value)} value={reorderThreshold} className='w-full px-3 py-2 border' type='number' min='1' placeholder='5' />
          </div>
          <div>
            <p className='text-xs text-gray-600 mb-1'>Auto Reorder Quantity</p>
            <input onChange={(e) => setReorderQuantity(e.target.value)} value={reorderQuantity} className='w-full px-3 py-2 border' type='number' min='1' placeholder='20' />
          </div>
        </div>
      </div>

      <div className='w-full max-w-[500px]'>
        <p className='mb-2'>Regions</p>
        <div className='flex gap-2 flex-wrap'>
          {['global', 'domestic', 'south_asia', 'international'].map((region) => (
            <button
              key={region}
              type='button'
              onClick={() => setRegions((prev) => prev.includes(region) ? prev.filter((item) => item !== region) : [...prev, region])}
              className={`text-xs px-3 py-1 border ${regions.includes(region) ? 'bg-black text-white' : 'bg-white'}`}
            >
              {region}
            </button>
          ))}
        </div>
      </div>

      <div className='w-full max-w-[500px] grid grid-cols-1 gap-3'>
        <p className='text-xs text-gray-600'>Advanced AR/VR (optional). Product page now has auto 3D preview even without these URLs.</p>
        <input onChange={(e) => setModel3dUrl(e.target.value)} value={model3dUrl} className='px-3 py-2 border' type='url' placeholder='3D model URL (optional)' />
        <input onChange={(e) => setVirtualTryOnUrl(e.target.value)} value={virtualTryOnUrl} className='px-3 py-2 border' type='url' placeholder='Virtual try-on URL (optional)' />
        <input onChange={(e) => setArSceneUrl(e.target.value)} value={arSceneUrl} className='px-3 py-2 border' type='url' placeholder='AR scene URL (optional)' />
      </div>

      <div>
        <p className='mb-2'>Product Sizes</p>
        <div className='flex gap-3'>
          {["S", "M", "L", "XL", "XXL"].map(size => (
            <div key={size} onClick={() => setSizes(prev => prev.includes(size) ? prev.filter(item => item !== size) : [...prev, size])}>
              <p className={`${sizes.includes(size) ? "bg-pink-100" : "bg-slate-200"} px-3 py-1 cursor-pointer`}>{size}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Collections */}
      <div className='w-full border border-gray-200 rounded p-4 bg-gray-50'>
        <p className='font-medium mb-3'>Collection Tags</p>
        <div className='flex flex-wrap gap-2 mb-3'>
          {COLLECTIONS.map(col => (
            <div
              key={col.value}
              onClick={() => toggleCollection(col.value)}
              className={`px-3 py-1.5 rounded-full text-sm cursor-pointer border transition ${selectedCollections.includes(col.value)
                ? 'bg-black text-white border-black'
                : 'bg-white text-gray-600 border-gray-300 hover:border-black'
                }`}
            >
              <span className='inline-flex items-center gap-1.5'>
                {col.logoSrc && !failedLogos[col.value] ? (
                  <img
                    src={col.logoSrc}
                    alt={col.label}
                    className='w-4 h-4 object-contain rounded-sm'
                    onError={() => setFailedLogos(prev => ({ ...prev, [col.value]: true }))}
                  />
                ) : col.Icon ? (
                  <col.Icon className='text-xs' />
                ) : (
                  <img src={assets.logo} alt='logo' className='w-4 h-4 object-contain rounded-sm' />
                )}
                {col.label}
              </span>
            </div>
          ))}
        </div>

        {selectedCollections.length > 0 && (
          <div className='flex items-center gap-2 mt-2'>
            <input
              type='checkbox'
              id='showInCollection'
              checked={showInCollection}
              onChange={() => setShowInCollection(prev => !prev)}
            />
            <label htmlFor='showInCollection' className='text-sm cursor-pointer'>
              Show in Collection page
            </label>
          </div>
        )}
      </div>
      <button type="submit" className='w-28 py-3 mt-4 bg-black text-white'>ADD</button>
    </form>
  )
}

export default Add