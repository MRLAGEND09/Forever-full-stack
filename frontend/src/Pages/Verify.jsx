import React, { useContext, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import axios from 'axios'
import { toast } from 'react-toastify'
import { ShopContext } from '../Context/ShopContext';

const Verify = () => {
  const { navigate, token, setCartItems, backendUrl } = useContext(ShopContext);
  const [searchParams] = useSearchParams();
  const success = searchParams.get('success');
  const orderId = searchParams.get('orderId');

  const verifyPayment = async () => {
    try {
      if (!token) return;

      const response = await axios.post(
        `${backendUrl}/api/order/verifystripe`,
        { success, orderId },
        { headers: { token } }
      );

      if (response.data.success) {
        setCartItems({});
        navigate('/order');
      } else {
        navigate('/cart');
      }
    } catch (error) {
      console.error(error);
      toast.error(error.message || 'Payment verification failed');
    }
  };

  useEffect(() => {
    if (success !== null && orderId !== null) {
      verifyPayment();
    }
  }, [token, success, orderId]);

  return (
    <div className="flex justify-center items-center min-h-screen">
      <p className="text-lg font-semibold">Verifying your payment...</p>
    </div>
  );
};

export default Verify;