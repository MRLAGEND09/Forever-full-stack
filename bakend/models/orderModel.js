import mongoose from 'mongoose'

const orderSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    clientOrderId: { type: String, default: '', index: true },
    items: { type: Array, required: true },
    amount: { type: Number, required: true },
    address: { type: Object, required: true },
    status: { type: String, required: true, default: 'Order Placed' },
    paymentMethod: { type: String, required: true },
    payment: { type: Boolean, required: true, default: false },
    date: { type: Number, required: true },
    cancelReason: { type: String, default: "" },
    couponDiscount: { type: Number, default: 0 },
    couponCode: { type: String, default: "" },
    productDiscount: { type: Number, default: 0 },
    // Order Accept/Reject
    accepted: { type: String, default: 'pending', enum: ['pending', 'accepted', 'rejected'] },
    rejectedReason: { type: String, default: "" },
    // Payment
    paidAt: { type: Date, default: null },
    paidBy: { type: String, default: "" },
    // Delivery
    deliveredAt: { type: Date, default: null },
    // Bill Voucher
    invoiceNumber: { type: String, default: "" },
    stripeSessionId: { type: String, default: '' },
    stripeSessionUrl: { type: String, default: '' },
    currencyCode: { type: String, default: 'BDT' },
    shippingMethod: { type: String, default: 'standard' },
    shippingRegion: { type: String, default: 'domestic' },
    shippingFee: { type: Number, default: 70 },
    deliverySlot: { type: String, default: '' },
    scheduledDeliveryAt: { type: Date, default: null },
    // Admin action attribution
    lastActionBy: { type: String, default: '' },
    actionHistory: {
        type: [{
            action: { type: String, default: '' },
            adminName: { type: String, default: '' },
            note: { type: String, default: '' },
            at: { type: Date, default: Date.now }
        }],
        default: []
    }
})

const orderModel = mongoose.models.order || mongoose.model('order', orderSchema)

export default orderModel;