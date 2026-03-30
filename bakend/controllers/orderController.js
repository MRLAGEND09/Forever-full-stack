import orderModel from "../models/orderModel.js";
import userModel from "../models/userModel.js";
import Stripe from 'stripe'
import nodemailer from 'nodemailer'

const currency = '৳'
const deliveryCharge = 70

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

// Email transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
})

// Generate invoice number
const generateInvoice = () => {
    const date = new Date()
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
    return `INV-${year}${month}${day}-${random}`
}

// Email styles
const emailStyles = `
    body { font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 30px auto; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    .header { background: #000; color: #fff; padding: 30px; text-align: center; }
    .header h1 { margin: 0; font-size: 28px; letter-spacing: 2px; }
    .body { padding: 30px; }
    .badge { border-radius: 6px; padding: 15px; text-align: center; margin-bottom: 25px; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 25px; }
    .info-box { background: #f9f9f9; border-radius: 6px; padding: 15px; }
    .info-box h4 { margin: 0 0 8px; color: #666; font-size: 12px; text-transform: uppercase; }
    .info-box p { margin: 0; color: #333; font-size: 14px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    thead { background: #f5f5f5; }
    th { padding: 10px; text-align: left; font-size: 13px; color: #666; }
    .total-section { background: #f9f9f9; border-radius: 6px; padding: 15px; }
    .total-row { display: flex; justify-content: space-between; padding: 5px 0; font-size: 14px; }
    .total-row.final { font-weight: bold; font-size: 16px; border-top: 2px solid #000; padding-top: 10px; margin-top: 5px; }
    .footer { background: #f5f5f5; padding: 20px; text-align: center; color: #999; font-size: 12px; }
    .steps { display: flex; justify-content: space-between; margin: 20px 0; }
    .step { text-align: center; flex: 1; }
    .step-circle { width: 30px; height: 30px; border-radius: 50%; margin: 0 auto 5px; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold; }
    .step-done { background: #4caf50; color: white; }
    .step-active { background: #2196f3; color: white; }
    .step-pending { background: #e0e0e0; color: #999; }
    .step p { font-size: 11px; color: #666; margin: 0; }
`

// Items HTML helper
const getItemsHTML = (items) => items.map(item => `
    <tr>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.name}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.size}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">${currency}${item.price}</td>
    </tr>
`).join('')

// Total HTML helper
const getTotalHTML = (order) => `
    <div class="total-section">
        <div class="total-row">
            <span>Subtotal</span>
            <span>${currency}${(order.amount - deliveryCharge + (order.couponDiscount || 0)).toFixed(2)}</span>
        </div>
        <div class="total-row">
            <span>Delivery Fee</span>
            <span>${currency}${deliveryCharge}</span>
        </div>
        ${order.couponDiscount > 0 ? `
        <div class="total-row" style="color: green;">
            <span>Coupon Discount</span>
            <span>-${currency}${order.couponDiscount}</span>
        </div>` : ''}
        ${order.productDiscount > 0 ? `
        <div class="total-row" style="color: green;">
            <span>Product Discount</span>
            <span>-${currency}${order.productDiscount}</span>
        </div>` : ''}
        <div class="total-row final">
            <span>Total</span>
            <span>${currency}${order.amount}</span>
        </div>
    </div>
`

// Send order placed email
const sendOrderConfirmationEmail = async (order, address) => {
    try {
        const emailHTML = `
        <!DOCTYPE html>
        <html>
        <head><meta charset="UTF-8"><style>${emailStyles}</style></head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>FOREVER</h1>
                    <p style="color: #ccc; margin: 5px 0 0;">Fashion & Style</p>
                </div>
                <div class="body">
                    <p style="color: #999; font-size: 13px;">Invoice: ${order.invoiceNumber}</p>
                    <div class="badge" style="background: #e8f5e9; border: 1px solid #4caf50;">
                        <p style="color: #2e7d32; margin: 0; font-size: 16px; font-weight: bold;">✅ Order Received Successfully!</p>
                    </div>
                    <p style="color: #333; font-size: 15px;">Hi <strong>${address.firstName} ${address.lastName}</strong>,</p>
                    <p style="color: #666; font-size: 14px;">Thank you for your order! We have received it and it is awaiting confirmation.</p>

                    <div class="steps">
                        <div class="step"><div class="step-circle step-done">✓</div><p>Placed</p></div>
                        <div class="step"><div class="step-circle step-pending">2</div><p>Confirmed</p></div>
                        <div class="step"><div class="step-circle step-pending">3</div><p>Shipped</p></div>
                        <div class="step"><div class="step-circle step-pending">4</div><p>Delivered</p></div>
                    </div>

                    <div class="info-grid">
                        <div class="info-box">
                            <h4>Order Date</h4>
                            <p>${new Date(order.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                        </div>
                        <div class="info-box">
                            <h4>Payment Method</h4>
                            <p>${order.paymentMethod === 'COD' ? 'Cash on Delivery' : 'Online Payment'}</p>
                        </div>
                        <div class="info-box">
                            <h4>Delivery Address</h4>
                            <p>${address.street}, ${address.city}, ${address.country}</p>
                        </div>
                        <div class="info-box">
                            <h4>Phone</h4>
                            <p>${address.phone}</p>
                        </div>
                    </div>

                    <h3 style="color: #333; margin-bottom: 10px;">Order Items</h3>
                    <table>
                        <thead><tr><th>Product</th><th style="text-align:center">Size</th><th style="text-align:center">Qty</th><th style="text-align:right">Price</th></tr></thead>
                        <tbody>${getItemsHTML(order.items)}</tbody>
                    </table>
                    ${getTotalHTML(order)}
                </div>
                <div class="footer">
                    <p>Thank you for shopping with FOREVER!</p>
                    <p>Questions? Contact us at ${process.env.EMAIL_USER}</p>
                </div>
            </div>
        </body>
        </html>`

        await transporter.sendMail({
            from: `"FOREVER Fashion" <${process.env.EMAIL_USER}>`,
            to: address.email,
            subject: `✅ Order Received - ${order.invoiceNumber}`,
            html: emailHTML
        })
        console.log('Order placed email sent to:', address.email)
    } catch (error) {
        console.log('Email error:', error)
    }
}

// Send order accepted email
const sendOrderAcceptedEmail = async (order) => {
    try {
        const address = order.address
        const emailHTML = `
        <!DOCTYPE html>
        <html>
        <head><meta charset="UTF-8"><style>${emailStyles}</style></head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>FOREVER</h1>
                    <p style="color: #ccc; margin: 5px 0 0;">Fashion & Style</p>
                </div>
                <div class="body">
                    <p style="color: #999; font-size: 13px;">Invoice: ${order.invoiceNumber}</p>
                    <div class="badge" style="background: #e3f2fd; border: 1px solid #2196f3;">
                        <p style="color: #1565c0; margin: 0; font-size: 16px; font-weight: bold;">🎉 Your Order Has Been Confirmed!</p>
                    </div>
                    <p style="color: #333; font-size: 15px;">Hi <strong>${address.firstName} ${address.lastName}</strong>,</p>
                    <p style="color: #666; font-size: 14px;">Great news! Your order has been confirmed and is being prepared for shipment.</p>

                    <div class="steps">
                        <div class="step"><div class="step-circle step-done">✓</div><p>Placed</p></div>
                        <div class="step"><div class="step-circle step-done">✓</div><p>Confirmed</p></div>
                        <div class="step"><div class="step-circle step-pending">3</div><p>Shipped</p></div>
                        <div class="step"><div class="step-circle step-pending">4</div><p>Delivered</p></div>
                    </div>

                    <div class="info-grid">
                        <div class="info-box">
                            <h4>Order Date</h4>
                            <p>${new Date(order.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                        </div>
                        <div class="info-box">
                            <h4>Payment Method</h4>
                            <p>${order.paymentMethod === 'COD' ? 'Cash on Delivery' : 'Online Payment'}</p>
                        </div>
                        <div class="info-box">
                            <h4>Delivery Address</h4>
                            <p>${address.street}, ${address.city}, ${address.country}</p>
                        </div>
                        <div class="info-box">
                            <h4>Phone</h4>
                            <p>${address.phone}</p>
                        </div>
                    </div>

                    <h3 style="color: #333; margin-bottom: 10px;">Order Items</h3>
                    <table>
                        <thead><tr><th>Product</th><th style="text-align:center">Size</th><th style="text-align:center">Qty</th><th style="text-align:right">Price</th></tr></thead>
                        <tbody>${getItemsHTML(order.items)}</tbody>
                    </table>
                    ${getTotalHTML(order)}
                </div>
                <div class="footer">
                    <p>Thank you for shopping with FOREVER!</p>
                    <p>Questions? Contact us at ${process.env.EMAIL_USER}</p>
                </div>
            </div>
        </body>
        </html>`

        await transporter.sendMail({
            from: `"FOREVER Fashion" <${process.env.EMAIL_USER}>`,
            to: address.email,
            subject: `🎉 Order Confirmed - ${order.invoiceNumber}`,
            html: emailHTML
        })
        console.log('Order accepted email sent to:', address.email)
    } catch (error) {
        console.log('Email error:', error)
    }
}

// Send order delivered email
const sendOrderDeliveredEmail = async (order) => {
    try {
        const address = order.address
        const emailHTML = `
        <!DOCTYPE html>
        <html>
        <head><meta charset="UTF-8"><style>${emailStyles}</style></head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>FOREVER</h1>
                    <p style="color: #ccc; margin: 5px 0 0;">Fashion & Style</p>
                </div>
                <div class="body">
                    <p style="color: #999; font-size: 13px;">Invoice: ${order.invoiceNumber}</p>
                    <div class="badge" style="background: #e8f5e9; border: 1px solid #4caf50;">
                        <p style="color: #2e7d32; margin: 0; font-size: 16px; font-weight: bold;">📦 Your Order Has Been Delivered!</p>
                    </div>
                    <p style="color: #333; font-size: 15px;">Hi <strong>${address.firstName} ${address.lastName}</strong>,</p>
                    <p style="color: #666; font-size: 14px;">Your order has been successfully delivered. We hope you love your purchase!</p>

                    <div class="steps">
                        <div class="step"><div class="step-circle step-done">✓</div><p>Placed</p></div>
                        <div class="step"><div class="step-circle step-done">✓</div><p>Confirmed</p></div>
                        <div class="step"><div class="step-circle step-done">✓</div><p>Shipped</p></div>
                        <div class="step"><div class="step-circle step-done">✓</div><p>Delivered</p></div>
                    </div>

                    <div class="info-grid">
                        <div class="info-box">
                            <h4>Order Date</h4>
                            <p>${new Date(order.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                        </div>
                        <div class="info-box">
                            <h4>Delivered On</h4>
                            <p>${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                        </div>
                        <div class="info-box">
                            <h4>Delivery Address</h4>
                            <p>${address.street}, ${address.city}, ${address.country}</p>
                        </div>
                        <div class="info-box">
                            <h4>Payment</h4>
                            <p>${order.payment ? '✅ Paid' : '⏳ ' + (order.paymentMethod === 'COD' ? 'Cash on Delivery' : 'Pending')}</p>
                        </div>
                    </div>

                    <h3 style="color: #333; margin-bottom: 10px;">Order Items</h3>
                    <table>
                        <thead><tr><th>Product</th><th style="text-align:center">Size</th><th style="text-align:center">Qty</th><th style="text-align:right">Price</th></tr></thead>
                        <tbody>${getItemsHTML(order.items)}</tbody>
                    </table>
                    ${getTotalHTML(order)}

                    <div style="background: #fff8e1; border: 1px solid #ffc107; border-radius: 6px; padding: 15px; text-align: center; margin-top: 20px;">
                        <p style="margin: 0; color: #333; font-size: 14px;">⭐ Enjoying your purchase? We'd love to hear from you!</p>
                        <p style="margin: 5px 0 0; color: #666; font-size: 13px;">Visit our website to leave a review.</p>
                    </div>
                </div>
                <div class="footer">
                    <p>Thank you for shopping with FOREVER!</p>
                    <p>Questions? Contact us at ${process.env.EMAIL_USER}</p>
                </div>
            </div>
        </body>
        </html>`

        await transporter.sendMail({
            from: `"FOREVER Fashion" <${process.env.EMAIL_USER}>`,
            to: address.email,
            subject: `📦 Order Delivered - ${order.invoiceNumber}`,
            html: emailHTML
        })
        console.log('Order delivered email sent to:', address.email)
    } catch (error) {
        console.log('Email error:', error)
    }
}

// Placing order using COD Method
const placeOrder = async (req, res) => {
    try {
        const { userId, items, address, amount, couponDiscount, couponCode } = req.body;

        const originalAmount = items.reduce((acc, item) => {
            return acc + (item.originalPrice || item.price) * item.quantity
        }, 0)
        const productDiscount = parseFloat((originalAmount - amount + deliveryCharge + (couponDiscount || 0)).toFixed(2))

        const orderData = {
            userId, items, address, amount,
            couponDiscount: couponDiscount || 0,
            couponCode: couponCode || '',
            productDiscount: productDiscount > 0 ? productDiscount : 0,
            paymentMethod: "COD",
            payment: false,
            date: Date.now(),
            accepted: 'pending',
            invoiceNumber: generateInvoice()
        }

        const newOrder = new orderModel(orderData)
        await newOrder.save()
        await userModel.findByIdAndUpdate(userId, { cartData: {} })
        await sendOrderConfirmationEmail(newOrder, address)

        res.json({ success: true, message: "Order Placed" })
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message })
    }
}

// Placing order using Stripe Method
const placeOrderStripe = async (req, res) => {
    try {
        const { userId, items, address, amount, couponDiscount, couponCode } = req.body;
        const { origin } = req.headers;

        const originalAmount = items.reduce((acc, item) => {
            return acc + (item.originalPrice || item.price) * item.quantity
        }, 0)
        const productDiscount = parseFloat((originalAmount - amount + deliveryCharge + (couponDiscount || 0)).toFixed(2))

        const orderData = {
            userId, items, address, amount,
            couponDiscount: couponDiscount || 0,
            couponCode: couponCode || '',
            productDiscount: productDiscount > 0 ? productDiscount : 0,
            paymentMethod: "stripe",
            payment: false,
            date: Date.now(),
            accepted: 'pending',
            invoiceNumber: generateInvoice()
        }

        const newOrder = new orderModel(orderData)
        await newOrder.save()
        await sendOrderConfirmationEmail(newOrder, address)

        const line_items = items.map((item) => ({
            price_data: {
                currency: currency,
                product_data: { name: item.name },
                unit_amount: Math.round(item.price * 100)
            },
            quantity: item.quantity
        }))

        line_items.push({
            price_data: {
                currency: currency,
                product_data: { name: 'Delivery Charges' },
                unit_amount: deliveryCharge * 100
            },
            quantity: 1
        })

        const session = await stripe.checkout.sessions.create({
            success_url: `${origin}/verify?success=true&orderId=${newOrder._id}`,
            cancel_url: `${origin}/verify?success=false&orderId=${newOrder._id}`,
            line_items,
            mode: 'payment'
        })

        res.json({ success: true, session_url: session.url });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message })
    }
}

// Verify stripe
const verifyStripe = async (req, res) => {
    const { orderId, success, userId } = req.body
    try {
        if (success === "true") {
            await orderModel.findByIdAndUpdate(orderId, { payment: true });
            await userModel.findByIdAndUpdate(userId, { cartData: {} })
            res.json({ success: true });
        } else {
            await orderModel.findByIdAndDelete(orderId)
            res.json({ success: false })
        }
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message })
    }
}

// All orders data for admin panel
const allOrders = async (req, res) => {
    try {
        const orders = await orderModel.find({})
        res.json({ success: true, orders });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// User order data for frontend
const userOrders = async (req, res) => {
    try {
        const { userId } = req.body
        const orders = await orderModel.find({ userId })
        res.json({ success: true, orders })
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message })
    }
}

// Update order status from admin panel
const updateStatus = async (req, res) => {
    try {
        const { orderId, status, cancelReason } = req.body;

        let updateData = { status };
        if (status === "Cancelled" && cancelReason) {
            updateData.cancelReason = cancelReason;
        }
        if (status === "Delivered") {
            updateData.deliveredAt = new Date()
        }

        const updatedOrder = await orderModel.findByIdAndUpdate(
            orderId, updateData, { new: true }
        );

        // Send delivered email
        if (status === 'Delivered' && updatedOrder) {
            await sendOrderDeliveredEmail(updatedOrder)
        }

        res.json({ success: true, message: "Status Updated", order: updatedOrder });
    } catch (error) {
        console.error(error);
        res.json({ success: false, message: error.message });
    }
};

// Accept or Reject order
const acceptOrder = async (req, res) => {
    try {
        const { orderId, accepted, rejectedReason } = req.body;

        let updateData = { accepted }
        if (accepted === 'rejected' && rejectedReason) {
            updateData.rejectedReason = rejectedReason
            updateData.status = 'Cancelled'
            updateData.cancelReason = rejectedReason
        }
        if (accepted === 'accepted') {
            updateData.status = 'Order Placed'
        }

        const updatedOrder = await orderModel.findByIdAndUpdate(orderId, updateData, { new: true })

        // Send accepted email
        if (accepted === 'accepted' && updatedOrder) {
            await sendOrderAcceptedEmail(updatedOrder)
        }

        res.json({ success: true, message: `Order ${accepted}` })
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message })
    }
}

// Mark order as paid
const markAsPaid = async (req, res) => {
    try {
        const { orderId, paidBy } = req.body;
        await orderModel.findByIdAndUpdate(orderId, {
            payment: true,
            paidAt: new Date(),
            paidBy: paidBy || 'Cash'
        }, { new: true })
        res.json({ success: true, message: 'Order marked as paid' })
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message })
    }
}

// Get pending orders
const getPendingOrders = async (req, res) => {
    try {
        const orders = await orderModel.find({ accepted: 'pending' }).sort({ date: -1 })
        res.json({ success: true, orders })
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message })
    }
}

export {
    verifyStripe, allOrders, placeOrder, placeOrderStripe,
    updateStatus, userOrders, acceptOrder, markAsPaid, getPendingOrders
}