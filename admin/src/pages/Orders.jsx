import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { bakendUrl } from '../App';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { assets } from '../assets/assets';
import notificationSound from '../assets/notification.mp3'
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { FaCheck, FaTimes, FaFilePdf, FaMoneyBillWave, FaEnvelope, FaPhone, FaTag, FaTicketAlt, FaBox } from 'react-icons/fa'

const Orders = ({ token, setNewOrderCount }) => {
  const [orders, setOrders] = useState([]);
  const [selectedOrders, setSelectedOrders] = useState([])
  const [bulkStatus, setBulkStatus] = useState('Shipped')
  const [invoiceModal, setInvoiceModal] = useState(null)
  const [sendingInvoiceOrderId, setSendingInvoiceOrderId] = useState(null)
  const [markingPaidOrderId, setMarkingPaidOrderId] = useState(null)
  const prevOrderCount = useRef(0)

  const getMoneyPrefix = (order) => `${order?.currencyCode || 'BDT'} `
  const formatMoney = (order, value) => `${getMoneyPrefix(order)}${Number(value || 0).toFixed(2)}`

  const fetchAllOrders = async () => {
    if (!token) return;
    try {
      const response = await axios.post(`${bakendUrl}/api/order/list`, {}, { headers: { token } });
      if (response.data.success) {
        const fetchedOrders = response.data.orders
        const currentCount = fetchedOrders.length
        if (prevOrderCount.current > 0 && currentCount > prevOrderCount.current) {
          const diff = currentCount - prevOrderCount.current
          setNewOrderCount && setNewOrderCount(prev => prev + diff)
          const audio = new Audio(notificationSound)
          audio.play().catch(() => { })
          toast.success(`🛍️ ${diff} new order received!`)
        }
        prevOrderCount.current = currentCount
        setOrders(fetchedOrders.reverse());
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error(error);
      toast.error(error.message);
    }
  };

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
        cancelReason: cancelReasonInput
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

  const toggleSelectOrder = (orderId) => {
    setSelectedOrders(prev =>
      prev.includes(orderId) ? prev.filter(id => id !== orderId) : [...prev, orderId]
    )
  }

  const selectAllOrders = () => {
    if (selectedOrders.length === orders.length) {
      setSelectedOrders([])
    } else {
      setSelectedOrders(orders.map(o => o._id))
    }
  }

  const bulkStatusUpdate = async () => {
    if (selectedOrders.length === 0) {
      toast.error('Please select at least one order!')
      return
    }
    try {
      await Promise.all(selectedOrders.map(orderId =>
        axios.post(`${bakendUrl}/api/order/status`, {
          orderId,
          status: bulkStatus,
          cancelReason: ''
        }, { headers: { token } })
      ))
      setOrders(prevOrders =>
        prevOrders.map(order =>
          selectedOrders.includes(order._id)
            ? { ...order, status: bulkStatus }
            : order
        )
      )
      setSelectedOrders([])
      toast.success(`${selectedOrders.length} orders updated to "${bulkStatus}"!`)
    } catch (error) {
      toast.error(error.message)
    }
  }

  const generateBillPDF = (order) => {
    const doc = new jsPDF();

    // Header
    doc.setFillColor(0, 0, 0);
    doc.rect(0, 0, 210, 35, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.text('BLOOP', 105, 15, { align: 'center' });
    doc.setFontSize(10);
    doc.text('Fashion & Style', 105, 23, { align: 'center' });
    doc.text('Bill Voucher', 105, 30, { align: 'center' });

    // Reset color
    doc.setTextColor(0, 0, 0);

    // Invoice info
    doc.setFontSize(10);
    doc.text(`Invoice: ${order.invoiceNumber || order._id}`, 15, 45);
    doc.text(`Date: ${new Date(order.date).toLocaleDateString()}`, 15, 52);
    doc.text(`Status: ${order.status}`, 15, 59);
    doc.text(`Payment: ${order.payment ? 'Paid' : 'Pending'}`, 130, 45);
    doc.text(`Method: ${order.paymentMethod}`, 130, 52);
    doc.text(`Currency: ${order.currencyCode || 'BDT'}`, 130, 59);

    // Divider
    doc.setDrawColor(200, 200, 200);
    doc.line(15, 65, 195, 65);

    // Customer Details
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('Customer Details', 15, 74);
    doc.setFont(undefined, 'normal');
    doc.setFontSize(10);
    doc.text(`Name: ${order.address.firstName} ${order.address.lastName}`, 15, 82);
    doc.text(`Address: ${order.address.street}, ${order.address.city}, ${order.address.country} - ${order.address.zipcode}`, 15, 89);
    doc.text(`Phone: ${order.address.phone}`, 15, 96);
    doc.text(`Email: ${order.address.email}`, 15, 103);
    doc.text(`Shipping: ${order.shippingRegion || 'domestic'} / ${order.shippingMethod || 'standard'}`, 15, 110);
    doc.text(`Slot: ${order.deliverySlot || 'anytime'}`, 15, 117);

    // Divider
    doc.line(15, 122, 195, 122);

    // Order Items Table
    const tableColumn = ["Product", "Size", "Qty", "Unit Price", "Total"];
    const tableRows = order.items.map(item => [
      item.name,
      item.size,
      item.quantity,
      formatMoney(order, item.price),
      formatMoney(order, item.price * item.quantity)
    ]);

    // Add PDF Table

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 127,
      headStyles: { fillColor: [0, 0, 0], textColor: 255 },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      styles: { fontSize: 9 }
    });

    // Totals
    const finalY = doc.lastAutoTable.finalY + 10;

    doc.setFontSize(10);

    const subtotal = order.items.reduce((acc, item) => acc + item.price * item.quantity, 0)
    doc.text(`Subtotal: ${formatMoney(order, subtotal)}`, 130, finalY);
    doc.text(`Delivery: ${formatMoney(order, Number(order.shippingFee || 70))}`, 130, finalY + 8);

    if (order.couponDiscount > 0) {
      doc.setTextColor(0, 150, 0);
      doc.text(`Coupon Discount: -${formatMoney(order, order.couponDiscount)}`, 130, finalY + 16);
      doc.setTextColor(0, 0, 0);
    }

    if (order.productDiscount > 0) {
      doc.setTextColor(0, 150, 0);
      doc.text(`Product Discount: -${formatMoney(order, order.productDiscount)}`, 130, finalY + 24);
      doc.setTextColor(0, 0, 0);
    }

    doc.setFont(undefined, 'bold');
    doc.setFontSize(12);
    doc.text(`Total: ${formatMoney(order, order.amount)}`, 130, finalY + 35);
    doc.setFont(undefined, 'normal');

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('Thank you for shopping with BLOOP!', 105, finalY + 50, { align: 'center' });
    doc.text('For support: contact@bloop.com', 105, finalY + 56, { align: 'center' });

    doc.save(`Invoice_${order.invoiceNumber || order._id}.pdf`);
    toast.success('Bill PDF generated successfully!');
  }

  const markPaymentDone = async (orderId, order) => {
    if (markingPaidOrderId === orderId) return
    setMarkingPaidOrderId(orderId)
    try {
      const response = await axios.post(`${bakendUrl}/api/order/mark-paid`, { orderId }, { headers: { token } });
      if (response.data.success) {
        setOrders(prevOrders =>
          prevOrders.map(o =>
            o._id === orderId ? { ...o, payment: true } : o
          )
        );
        toast.success("Payment marked as done!");
        // Show invoice modal
        setInvoiceModal(order)
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error(error);
      toast.error(error.message);
    } finally {
      setMarkingPaidOrderId(null)
    }
  }

  const sendInvoice = async (orderId, method) => {
    if (sendingInvoiceOrderId === orderId) return
    setSendingInvoiceOrderId(orderId)
    try {
      const response = await axios.post(`${bakendUrl}/api/order/send-invoice`, { orderId, method }, { headers: { token } })
      toast.success(response.data?.duplicate ? 'Duplicate click blocked. Invoice already sent.' : `Invoice sent by ${method} successfully!`)
      setInvoiceModal(null)
    } catch (e) {
      toast.error('Invoice send failed: ' + e.message)
    } finally {
      setSendingInvoiceOrderId(null)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'Order Placed': return 'text-yellow-500'
      case 'Shipped': return 'text-blue-500'
      case 'Out For Delivery': return 'text-orange-500'
      case 'Delivered': return 'text-green-500'
      case 'Cancelled': return 'text-red-500'
      default: return 'text-gray-500'
    }
  }

  useEffect(() => {
    fetchAllOrders()
    const interval = setInterval(fetchAllOrders, 10000)
    return () => clearInterval(interval)
  }, [token]);

  return (
    <div>
      {/* Invoice Modal */}
      {invoiceModal && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
          <div className='bg-white rounded-lg p-6 w-96 shadow-xl'>
            <h3 className='text-lg font-semibold mb-2'>Send Invoice</h3>
            <p className='text-sm text-gray-500 mb-4'>
              Payment marked as done for <strong>{invoiceModal.address.firstName} {invoiceModal.address.lastName}</strong>.
              How would you like to send the invoice?
            </p>
            <div className='flex flex-col gap-3'>
              <button
                onClick={() => sendInvoice(invoiceModal._id, 'email')}
                disabled={sendingInvoiceOrderId === invoiceModal._id}
                className='flex items-center gap-2 bg-blue-500 disabled:bg-blue-300 text-white px-4 py-2 rounded hover:bg-blue-600'
              >
                <FaEnvelope /> {sendingInvoiceOrderId === invoiceModal._id ? 'Sending...' : 'Send via Email'}
              </button>
              <button
                onClick={() => sendInvoice(invoiceModal._id, 'sms')}
                disabled={sendingInvoiceOrderId === invoiceModal._id}
                className='flex items-center gap-2 bg-green-500 disabled:bg-green-300 text-white px-4 py-2 rounded hover:bg-green-600'
              >
                <FaPhone /> Send via SMS
              </button>
              <button
                onClick={() => { generateBillPDF(invoiceModal); setInvoiceModal(null); }}
                className='flex items-center gap-2 bg-gray-700 text-white px-4 py-2 rounded hover:bg-gray-800'
              >
                <FaFilePdf /> Download PDF
              </button>
              <button
                onClick={() => {
                  sendInvoice(invoiceModal._id, 'email');
                  sendInvoice(invoiceModal._id, 'sms');
                }}
                className='flex items-center gap-2 bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600'
              >
                <FaCheck /> Send Both (Email + SMS)
              </button>
              <button
                onClick={() => setInvoiceModal(null)}
                className='flex items-center gap-2 bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300'
              >
                <FaTimes /> Skip
              </button>
            </div>
          </div>
        </div>
      )}

      <div className='flex items-center justify-between mb-4'>
        <h3 className='text-xl font-semibold'>Order Page</h3>
        <p className='text-sm text-gray-500'>Total Orders: <span className='font-bold text-black'>{orders.length}</span></p>
      </div>

      {/* Bulk Update Bar */}
      <div className='flex items-center gap-3 bg-gray-100 p-3 rounded mb-4'>
        <input
          type='checkbox'
          onChange={selectAllOrders}
          checked={selectedOrders.length === orders.length && orders.length > 0}
          className='w-4 h-4 cursor-pointer'
        />
        <p className='text-sm text-gray-600'>Select All ({selectedOrders.length} selected)</p>
        {selectedOrders.length > 0 && (
          <>
            <select
              value={bulkStatus}
              onChange={(e) => setBulkStatus(e.target.value)}
              className='p-2 text-sm border rounded'
            >
              <option value="Order Placed">Order Placed</option>
              <option value="Shipped">Shipped</option>
              <option value="Out For Delivery">Out For Delivery</option>
              <option value="Delivered">Delivered</option>
            </select>
            <button onClick={bulkStatusUpdate} className='bg-black text-white text-sm px-4 py-2 rounded flex items-center gap-1'>
              <FaCheck /> Update {selectedOrders.length} Orders
            </button>
            <button onClick={() => setSelectedOrders([])} className='bg-gray-400 text-white text-sm px-4 py-2 rounded flex items-center gap-1'>
              <FaTimes /> Clear
            </button>
          </>
        )}
      </div>

      <div>
        {orders.map((order, index) => {
          const latestAction = Array.isArray(order.actionHistory) && order.actionHistory.length > 0
            ? order.actionHistory[order.actionHistory.length - 1]
            : null
          const originalAmount = order.items.reduce((acc, item) => {
            return acc + (item.originalPrice || item.price) * item.quantity
          }, 0)
          const productDiscount = originalAmount - (order.amount + (order.couponDiscount || 0) + Number(order.shippingFee || 70))
          const hasProductDiscount = productDiscount > 0.5

          return (
            <div
              className={`grid grid-cols-1 sm:grid-cols-[0.3fr_0.5fr_2fr_1fr_1fr_1fr] gap-3 items-start border-2 p-5 md:p-8 my-3 md:my-4 text-xs sm:text-sm text-gray-700 ${selectedOrders.includes(order._id) ? 'border-black bg-gray-50' : 'border-gray-200'}`}
              key={index}
            >
              <input
                type='checkbox'
                checked={selectedOrders.includes(order._id)}
                onChange={() => toggleSelectOrder(order._id)}
                className='w-4 h-4 cursor-pointer mt-1'
              />
              <img className='w-12' src={assets.parcel_icon} alt="" />

              <div>
                <div>
                  {order.items.map((item, itemIndex) => (
                    <p className='py-0.5' key={itemIndex}>
                      {item.name} x {item.quantity} <span>{item.size}</span>
                      {item.discount > 0 && item.discountActive && (
                        <span className='ml-1 bg-red-100 text-red-500 text-xs px-1 rounded'>
                          {item.discount}% OFF
                        </span>
                      )}
                    </p>
                  ))}
                </div>
                <p className='mt-3 font-medium'>
                  {order.address.firstName + " " + order.address.lastName}
                </p>
                <div>
                  <p>{order.address.street + ","}</p>
                  <p>{order.address.city + ", " + order.address.country + ", " + order.address.zipcode}</p>
                </div>
                <p>{order.address.phone}</p>
                <p className='text-blue-500 mt-1 flex items-center gap-1'>
                  <FaEnvelope /> {order.address.email}
                </p>
              </div>

              <div>
                <p className='text-sm sm:text-[15px]'>Items: {order.items.length}</p>
                <p className='mt-3'>Method: {order.paymentMethod}</p>
                <p>Payment: {order.payment ? '✅ Done' : '⏳ Pending'}</p>
                <p>Date: {new Date(order.date).toLocaleDateString()}</p>
              </div>

              <div>
                <p className='text-sm sm:text-[15px] font-medium'>{formatMoney(order, order.amount)}</p>
                {hasProductDiscount && (
                  <p className='text-red-500 text-xs mt-1 flex items-center gap-1'>
                    <FaTag /> Product discount
                  </p>
                )}
                {order.couponDiscount > 0 && (
                  <p className='text-blue-500 text-xs mt-1 flex items-center gap-1'>
                    <FaTicketAlt /> Coupon: -{formatMoney(order, order.couponDiscount)}
                  </p>
                )}
                <p className='text-xs mt-1 text-gray-600'>Ship: {order.shippingRegion || 'domestic'} / {order.shippingMethod || 'standard'}</p>
                <p className='text-xs text-gray-600'>Fee: {formatMoney(order, Number(order.shippingFee || 70))}</p>
                {order.deliverySlot && <p className='text-xs text-gray-600'>Slot: {order.deliverySlot}</p>}
                {order.scheduledDeliveryAt && <p className='text-xs text-gray-600'>Scheduled: {new Date(order.scheduledDeliveryAt).toLocaleString()}</p>}
                <p className={`text-xs mt-2 font-semibold ${getStatusColor(order.status)}`}>
                  ● {order.status}
                </p>
                {order.invoiceNumber && (
                  <p className='text-xs text-gray-400 mt-1'>#{order.invoiceNumber}</p>
                )}
                {order.lastActionBy && (
                  <p className='text-xs text-purple-600 mt-1'>Last action by: {order.lastActionBy}</p>
                )}
                {latestAction?.at && (
                  <p className='text-xs text-gray-400'>Updated: {new Date(latestAction.at).toLocaleString()}</p>
                )}
              </div>

              <div className='flex flex-col gap-2'>
                <select
                  onChange={(event) => statusHandler(event, order._id)}
                  value={order.status || "Order Placed"}
                  className='p-2 font-semibold border rounded'
                >
                  <option value="Order Placed">Order Placed</option>
                  <option value="Shipped">Shipped</option>
                  <option value="Out For Delivery">Out For Delivery</option>
                  <option value="Delivered">Delivered</option>
                  <option value="Cancelled">Cancel Order</option>
                </select>

                {order.status === "Cancelled" && order.cancelReason && (
                  <p className="text-gray-500 text-xs mt-1">
                    Reason: {order.cancelReason}
                  </p>
                )}

                <div className='flex flex-wrap gap-2 mt-1'>
                  <button
                    onClick={() => generateBillPDF(order)}
                    className='flex items-center gap-1 bg-gray-700 text-white text-xs px-3 py-1 rounded hover:bg-gray-800'
                  >
                    <FaFilePdf /> PDF
                  </button>

                  {order.status !== 'Cancelled' && !order.payment && (
                    <button
                      onClick={() => markPaymentDone(order._id, order)}
                      disabled={markingPaidOrderId === order._id}
                      className='flex items-center gap-1 bg-green-500 disabled:bg-green-300 text-white text-xs px-3 py-1 rounded hover:bg-green-600'
                    >
                      <FaMoneyBillWave /> {markingPaidOrderId === order._id ? 'Marking...' : 'Mark Paid'}
                    </button>
                  )}

                  {order.payment && (
                    <button
                      onClick={() => setInvoiceModal(order)}
                      className='flex items-center gap-1 bg-blue-500 text-white text-xs px-3 py-1 rounded hover:bg-blue-600'
                    >
                      <FaEnvelope /> Send Invoice
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  );
};

export default Orders;