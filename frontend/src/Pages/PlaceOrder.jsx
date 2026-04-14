import React, { useContext, useState, useEffect, useRef } from 'react'
import Title from '../components/Title'
import CartTotal from '../components/CartTotal'
import { assets } from '../assets/assets'
import axios from 'axios'
import { toast } from 'react-toastify'
import { ShopContext } from '../context/ShopContext'

const COUNTRY_OPTIONS = [
  { name: 'Bangladesh', code: 'bd' },
  { name: 'India', code: 'in' },
  { name: 'Pakistan', code: 'pk' },
  { name: 'Nepal', code: 'np' },
  { name: 'Bhutan', code: 'bt' },
  { name: 'Sri Lanka', code: 'lk' },
  { name: 'United Arab Emirates', code: 'ae' },
  { name: 'Saudi Arabia', code: 'sa' },
  { name: 'Malaysia', code: 'my' },
  { name: 'Singapore', code: 'sg' },
  { name: 'United Kingdom', code: 'gb' },
  { name: 'United States', code: 'us' }
]

const PlaceOrder = () => {
  const [method, setMethod] = useState('cod');
  const { navigate, backendUrl, token, cartItems, setCartItems, getCartAmount, delivery_fee, products, currency, convertPrice } = useContext(ShopContext);
  const [shippingRegion, setShippingRegion] = useState('domestic')
  const [shippingMethod, setShippingMethod] = useState('standard')
  const [shippingOptions, setShippingOptions] = useState([])
  const [deliverySlot, setDeliverySlot] = useState('')
  const [scheduledDeliveryAt, setScheduledDeliveryAt] = useState('')
  const [savedAddresses, setSavedAddresses] = useState([])
  const [saveThisAddress, setSaveThisAddress] = useState(false)
  const [savePaymentForOneClick, setSavePaymentForOneClick] = useState(false)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    street: '',
    city: '',
    state: '',
    zipcode: '',
    country: '',
    phone: '',
  })
  const [couponCode, setCouponCode] = useState('')
  const [discount, setDiscount] = useState(0)
  const [couponApplied, setCouponApplied] = useState(false)
  const [couponLoading, setCouponLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const clientOrderIdRef = useRef('')

  const getClientOrderId = () => {
    if (!clientOrderIdRef.current) {
      clientOrderIdRef.current = typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `order_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
    }

    return clientOrderIdRef.current
  }

  const resetClientOrderId = () => {
    clientOrderIdRef.current = ''
  }

  useEffect(() => {
    fetchShippingOptions()
  }, [shippingRegion])

  useEffect(() => {
    fetchSavedAddresses()
  }, [token])

  // Save abandoned cart when user visits checkout page
  useEffect(() => {
    const saveAbandonedCart = async () => {
      if (!token || Object.keys(cartItems).length === 0) return
      try {
        let orderItems = []
        for (const items in cartItems) {
          for (const item in cartItems[items]) {
            if (cartItems[items][item] > 0) {
              const itemInfo = structuredClone(products.find(product => product._id === items))
              if (itemInfo) {
                itemInfo.size = item
                itemInfo.quantity = cartItems[items][item]
                orderItems.push(itemInfo)
              }
            }
          }
        }
        if (orderItems.length === 0) return
        await axios.post(backendUrl + '/api/abandoned/save', {
          items: orderItems,
          amount: getCartAmount() + Number(selectedShipping?.fee || delivery_fee)
        }, { headers: { token } })
      } catch (error) {
        console.log('Abandoned cart save error:', error)
      }
    }
    saveAbandonedCart()
  }, [token, cartItems, products])

  const onChangeHandler = (event) => {
    const name = event.target.name
    const value = event.target.value
    setFormData(data => ({ ...data, [name]: value }))
  }

  const selectedCountry = COUNTRY_OPTIONS.find((country) => country.name === formData.country)

  const selectedShipping = shippingOptions.find((item) => item.method === shippingMethod)

  const fetchShippingOptions = async () => {
    try {
      const response = await axios.get(`${backendUrl}/api/order/shipping-options?region=${shippingRegion}`)
      if (response.data.success) {
        const options = response.data.options || []
        setShippingOptions(options)
        if (options.length > 0) {
          setShippingMethod(options[0].method)
        }
      }
    } catch (error) {
      console.log(error)
    }
  }

  const fetchSavedAddresses = async () => {
    if (!token) return
    try {
      const response = await axios.post(backendUrl + '/api/user/address/list', {}, { headers: { token } })
      if (response.data.success) {
        setSavedAddresses(response.data.addresses || [])
      }
    } catch (error) {
      console.log(error)
    }
  }

  const applySavedAddress = (address) => {
    setFormData((prev) => ({
      ...prev,
      firstName: prev.firstName || '',
      lastName: prev.lastName || '',
      email: prev.email || '',
      ...address
    }))
  }

  const applyCoupon = async () => {
    if (!couponCode) {
      toast.error('Please enter a coupon code!')
      return
    }
    setCouponLoading(true)
    try {
      const response = await axios.post(backendUrl + '/api/subscriber/validate', { couponCode })
      if (response.data.success) {
        setDiscount(response.data.discount)
        setCouponApplied(true)
        toast.success('20% discount applied!')
      } else {
        toast.error(response.data.message)
        setDiscount(0)
        setCouponApplied(false)
      }
    } catch (error) {
      toast.error('Something went wrong!')
    }
    setCouponLoading(false)
  }

  const getFinalAmount = () => {
    const shippingFee = Number(selectedShipping?.fee || delivery_fee)
    const cartAmount = getCartAmount() + shippingFee
    if (couponApplied) {
      return cartAmount - (cartAmount * discount / 100)
    }
    return cartAmount
  }

  const onSubmitHandler = async (event) => {
    event.preventDefault()
    if (isSubmitting) return

    setIsSubmitting(true)

    try {
      let orderItems = []
      for (const items in cartItems) {
        for (const item in cartItems[items]) {
          if (cartItems[items][item] > 0) {
            const itemInfo = structuredClone(products.find(product => product._id === items))
            if (itemInfo) {
              itemInfo.size = item
              itemInfo.quantity = cartItems[items][item]
              orderItems.push(itemInfo)
            }
          }
        }
      }

      const cartAmount = getCartAmount()
      const shippingFee = Number(selectedShipping?.fee || delivery_fee)
      const couponDiscountAmount = couponApplied
        ? parseFloat(((cartAmount + shippingFee) * discount / 100).toFixed(2))
        : 0

      let orderData = {
        address: formData,
        items: orderItems,
        amount: getFinalAmount(),
        couponDiscount: couponDiscountAmount,
        couponCode: couponApplied ? couponCode : '',
        clientOrderId: getClientOrderId(),
        shippingRegion,
        shippingMethod,
        deliverySlot,
        scheduledDeliveryAt: scheduledDeliveryAt || null
      }

      switch (method) {
        case 'cod':
          const response = await axios.post(backendUrl + '/api/order/place', orderData, { headers: { token } })
          if (response.data.success) {
            // Clear abandoned cart after successful order
            await axios.post(backendUrl + '/api/abandoned/clear', {}, { headers: { token } })
            if (saveThisAddress) {
              await axios.post(backendUrl + '/api/user/address/add', { ...formData, label: 'Saved Address' }, { headers: { token } })
            }
            if (savePaymentForOneClick) {
              await axios.post(backendUrl + '/api/user/payment/save', {
                provider: method,
                last4: formData.phone.slice(-4),
                brand: method === 'stripe' ? 'Card' : 'COD',
                holderName: `${formData.firstName} ${formData.lastName}`
              }, { headers: { token } })
            }
            setCartItems({})
            resetClientOrderId()
            navigate('/order')
          } else {
            toast.error(response.data.message)
            resetClientOrderId()
          }
          break;

        case 'stripe':
          const responseStripe = await axios.post(backendUrl + '/api/order/stripe', orderData, { headers: { token } })
          if (responseStripe.data.success) {
            await axios.post(backendUrl + '/api/abandoned/clear', {}, { headers: { token } })
            if (saveThisAddress) {
              await axios.post(backendUrl + '/api/user/address/add', { ...formData, label: 'Saved Address' }, { headers: { token } })
            }
            if (savePaymentForOneClick) {
              await axios.post(backendUrl + '/api/user/payment/save', {
                provider: 'stripe',
                last4: formData.phone.slice(-4),
                brand: 'Card',
                holderName: `${formData.firstName} ${formData.lastName}`
              }, { headers: { token } })
            }
            const { session_url } = responseStripe.data
            window.location.replace(session_url)
          } else {
            toast.error(responseStripe.data.message)
            resetClientOrderId()
          }
          break;

        default:
          resetClientOrderId()
          break;
      }

    } catch (error) {
      console.log(error);
      toast.error(error.message)
      resetClientOrderId()
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={onSubmitHandler} className='flex flex-col sm:flex-row justify-between gap-4 pt-5 sm:pt-14 min-h-[80vh] border-t'>
      {/*------ left side ------- */}
      <div className='flex flex-col gap-4 w-full sm:max-w-[480px]'>
        <div className='text-xl sm:text-2xl my-3'>
          <Title text1={'DELIVERY'} text2={'INFORMATION'} />
        </div>

        {savedAddresses.length > 0 && (
          <div className='border p-3 bg-gray-50'>
            <p className='text-sm font-medium mb-2'>Use saved address</p>
            <div className='flex flex-wrap gap-2'>
              {savedAddresses.map((address, index) => (
                <button type='button' key={index} onClick={() => applySavedAddress(address)} className='text-xs border px-2 py-1 hover:bg-gray-100'>
                  {address.label || `Address ${index + 1}`} - {address.city}
                </button>
              ))}
            </div>
          </div>
        )}
        <div className='flex gap-3'>
          <input required onChange={onChangeHandler} name='firstName' value={formData.firstName} className='border border-gray-300 rounded py-1.5 px-3.5 w-full' type="text" placeholder='First name' />
          <input required onChange={onChangeHandler} name='lastName' value={formData.lastName} className='border border-gray-300 rounded py-1.5 px-3.5 w-full' type="text" placeholder='Last name' />
        </div>
        <input required onChange={onChangeHandler} name='email' value={formData.email} className='border border-gray-300 rounded py-1.5 px-3.5 w-full' type="email" placeholder='Email address' />
        <input required onChange={onChangeHandler} name='street' value={formData.street} className='border border-gray-300 rounded py-1.5 px-3.5 w-full' type="text" placeholder='Street' />
        <div className='flex gap-3'>
          <input required onChange={onChangeHandler} name='city' value={formData.city} className='border border-gray-300 rounded py-1.5 px-3.5 w-full' type="text" placeholder='City' />
          <input required onChange={onChangeHandler} name='state' value={formData.state} className='border border-gray-300 rounded py-1.5 px-3.5 w-full' type="text" placeholder='State' />
        </div>
        <div className='flex gap-3'>
          <input required onChange={onChangeHandler} name='zipcode' value={formData.zipcode} className='border border-gray-300 rounded py-1.5 px-3.5 w-full' type="number" placeholder='Zipcode' />
          <div className='relative w-full'>
            <select
              required
              onChange={onChangeHandler}
              name='country'
              value={formData.country}
              className='border border-gray-300 rounded py-1.5 pl-3.5 pr-14 w-full bg-white text-gray-700'
            >
              <option value=''>Select Country</option>
              {COUNTRY_OPTIONS.map((country) => (
                <option key={country.code} value={country.name}>{country.name}</option>
              ))}
            </select>
            {selectedCountry && (
              <img
                src={`https://flagcdn.com/24x18/${selectedCountry.code}.png`}
                alt={`${selectedCountry.name} flag`}
                className='absolute right-8 top-1/2 -translate-y-1/2 h-[14px] w-[20px] object-cover rounded-sm border border-gray-200 pointer-events-none'
                loading='lazy'
              />
            )}
          </div>
        </div>
        <input required onChange={onChangeHandler} name='phone' value={formData.phone} className='border border-gray-300 rounded py-1.5 px-3.5 w-full' type="number" placeholder='Phone' />

        <div className='border p-3 bg-gray-50'>
          <p className='text-sm font-medium mb-2'>Shipping Region</p>
          <select value={shippingRegion} onChange={(e) => setShippingRegion(e.target.value)} className='border px-3 py-2 w-full mb-2'>
            <option value='domestic'>Domestic</option>
            <option value='south_asia'>South Asia</option>
            <option value='international'>International</option>
          </select>

          <p className='text-sm font-medium mb-2'>Shipping Method</p>
          <select value={shippingMethod} onChange={(e) => setShippingMethod(e.target.value)} className='border px-3 py-2 w-full'>
            {shippingOptions.map((option) => (
              <option key={option.method} value={option.method}>
                {option.label} - {currency}{convertPrice(option.fee).toFixed(2)} ({option.eta})
              </option>
            ))}
          </select>
        </div>

        <div className='border p-3 bg-gray-50'>
          <p className='text-sm font-medium mb-2'>Order Scheduling</p>
          <select value={deliverySlot} onChange={(e) => setDeliverySlot(e.target.value)} className='border px-3 py-2 w-full mb-2'>
            <option value=''>Deliver anytime</option>
            <option value='morning'>Morning (9am - 12pm)</option>
            <option value='afternoon'>Afternoon (12pm - 4pm)</option>
            <option value='evening'>Evening (4pm - 9pm)</option>
          </select>
          <input type='datetime-local' value={scheduledDeliveryAt} onChange={(e) => setScheduledDeliveryAt(e.target.value)} className='border px-3 py-2 w-full' />
        </div>

        <label className='text-sm flex items-center gap-2'>
          <input type='checkbox' checked={saveThisAddress} onChange={(e) => setSaveThisAddress(e.target.checked)} />
          Save this address for faster checkout
        </label>
        <label className='text-sm flex items-center gap-2'>
          <input type='checkbox' checked={savePaymentForOneClick} onChange={(e) => setSavePaymentForOneClick(e.target.checked)} />
          Save this payment setup for one-click buy
        </label>
      </div>

      {/*------ right side ----- */}
      <div className='mt-8'>
        <div className='mt-8 min-w-80'>
          <CartTotal discount={discount} couponApplied={couponApplied} shippingFee={Number(selectedShipping?.fee || delivery_fee)} />
        </div>

        {/* ------ coupon code box ------ */}
        <div className='mt-6'>
          <p className='text-sm font-medium mb-2'>Have a coupon code?</p>
          <div className='flex items-center gap-2 border pl-3'>
            <input
              className='w-full outline-none py-2 text-sm'
              type="text"
              placeholder='Enter coupon code'
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
              disabled={couponApplied}
            />
            <button
              type='button'
              onClick={applyCoupon}
              disabled={couponApplied || couponLoading}
              className='bg-black text-white text-xs px-6 py-3 whitespace-nowrap'
            >
              {couponApplied ? 'APPLIED ✓' : couponLoading ? 'Checking...' : 'APPLY'}
            </button>
          </div>
          {couponApplied && (
            <p className='text-green-500 text-sm mt-1'>
              ✅ 20% coupon discount applied! Final: {currency}{convertPrice(getFinalAmount()).toFixed(2)}
            </p>
          )}
        </div>

        <div className='mt-8'>
          <Title text1={'PAYMENT'} text2={'METHOD'} />
          <div className='flex gap-3 flex-col lg:flex-row'>
            <div onClick={() => setMethod('stripe')} className='flex items-center gap-3 border p-2 px-3 cursor-pointer'>
              <p className={`min-w-3.5 h-3.5 border rounded-full ${method === 'stripe' ? 'bg-green-400' : ''}`}></p>
              <img className='h-5 mx-4' src={assets.stripe_logo} alt="" />
            </div>
            <div onClick={() => setMethod('cod')} className='flex items-center gap-3 border p-2 px-3 cursor-pointer'>
              <p className={`min-w-3.5 h-3.5 border rounded-full ${method === 'cod' ? 'bg-green-400' : ''}`}></p>
              <p className='text-gray-500 text-sm font-medium mx-4'>CASH ON DELIVERY</p>
            </div>
          </div>
          <div className='w-full text-end mt-8'>
            <button disabled={isSubmitting} type='submit' className='bg-black text-white px-16 py-3 text-sm disabled:opacity-60 disabled:cursor-not-allowed'>
              {isSubmitting ? 'PLACING...' : 'PLACE ORDER'}
            </button>
          </div>
        </div>
      </div>
    </form>
  )
}

export default PlaceOrder