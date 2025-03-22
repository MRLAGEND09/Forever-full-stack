import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { bakendUrl, currency } from '../App';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { assets } from '../assets/assets';

const Orders = ({ token }) => {
  const [orders, setOrders] = useState([]);

  // Fetch all orders from backend
  const fetchAllOrders = async () => {
    if (!token) return;

    try {
      const response = await axios.post(`${bakendUrl}/api/order/list`, {}, { headers: { token } });

      if (response.data.success) {
        setOrders(response.data.orders);
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error(error);
      toast.error(error.message);
    }
  };

  // Handle order status change
  const statusHandler = async (event, orderId) => {
    const selectedStatus = event.target.value;
    let cancelReasonInput = "";

    if (selectedStatus === "Cancelled") {
      cancelReasonInput = prompt("Enter cancellation reason:");
      if (!cancelReasonInput) {
        toast.error("Cancellation reason is required.");
        return;
      }
    }

    try {
      const response = await axios.post(`${bakendUrl}/api/order/status`, {
        orderId,
        status: selectedStatus,
        cancelReason: cancelReasonInput // ✅ Send reason
      }, { headers: { token } });

      if (response.data.success) {
        setOrders(prevOrders =>
          prevOrders.map(order =>
            order._id === orderId
              ? { ...order, status: selectedStatus, cancelReason: cancelReasonInput }
              : order
          )
        );
        toast.success("Order status updated successfully.");
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error(error);
      toast.error(error.message);
    }
  };

  useEffect(() => {
    fetchAllOrders();
  }, [token]);

  return (
    <div>
      <h3>Order Page</h3>
      <div>
        {orders.map((order, index) => (
          <div className='grid grid-cols-1 sm:grid-cols-[0.5fr_2fr_1fr] lg:grid-cols-[0.5fr_2fr_1fr_1fr_1fr] gap-3 items-start border-2 border-gray-200 p-5 md:p-8 my-3 md:my-4 text-xs sm:text-sm text-gray-700' key={index}>
            <img className='w-12' src={assets.parcel_icon} alt="" />
            <div>
              <div>
                {order.items.map((item, itemIndex) => (
                  <p className='py-0.5' key={itemIndex}>
                    {item.name} x {item.quantity} <span>{item.size}</span>
                  </p>
                ))}
              </div>
              <p className='mt-3 md-2 font-medium'>
                {order.address.firstName + " " + order.address.lastName}
              </p>

              <div>
                <p>{order.address.street + ","}</p>
                <p>{order.address.city + ", " + order.address.country + ", " + order.address.zipcode}</p>
              </div>
              <p>{order.address.phone} </p>
            </div>
            <div>
              <p className='text-sm sm:text-[15px]'>Items: {order.items.length} </p>
              <p className='mt-3'>Method: {order.paymentMethod}</p>
              <p>Payment: {order.payment ? 'Done' : 'Pending'}</p>
              <p>Date: {new Date(order.date).toLocaleDateString()}</p>
            </div>
            <p className='text-sm sm:text-[15px]'>{currency}{order.amount} </p>

            {/* Status Dropdown */}
            <select onChange={(event) => statusHandler(event, order._id)} value={order.status || "Order Placed"} className='p-2 font-semibold'>
              <option value="Order Placed">Order Placed</option>
              <option value="Shipped">Shipped</option>
              <option value="Out For Delivery">Out For Delivery</option>
              <option value="Delivered">Delivered</option>
              <option value="Cancelled">Cancel Order</option>
            </select>

            {/* Show cancellation reason if order is cancelled */}
            {order.status === "Cancelled" && order.cancelReason && (
              <p className="text-gray-500 font-semibold mt-2">
                Cancellation Reason: {order.cancelReason}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Orders;
