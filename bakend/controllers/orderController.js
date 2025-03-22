import orderModel from "../models/orderModel.js";
import userModel from "../models/userModel.js";
import Stripe from 'stripe'


//global variables
const currency = 'usd'
const deliveryCharge = 10

// gataway initialize
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

// Placing order useing COD Method
const placeOrder = async (req, res) => {

  try {

    const { userId, items, address, amount } = req.body;

    const orderData = {
      userId,
      items,
      address,
      amount,
      paymentMethod: "COD",
      payment: false,
      date: Date.now()
    }

    const newOrder = new orderModel(orderData)
    await newOrder.save()

    await userModel.findByIdAndUpdate(userId, { cartData: {} })

    res.json({ success: true, message: "Order Placed" })
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message })
  }
}


// Placing order useing Stripe Method
const placeOrderStripe = async (req, res) => {
  try {
    
    const { userId, items, address, amount } = req.body;

    const {origin} = req.headers;

    const orderData = {
      userId,
      items,
      address,
      amount,
      paymentMethod: "stripe",
      payment: false,
      date: Date.now()
    }

    const newOrder = new orderModel(orderData)
    await newOrder.save()

    const line_items = items.map((item) => ({
      price_data: {
        currency:currency,
        product_data:{
          name:item.name
        },
        unit_amount:item.price * 100
      },
      quantity:item.quantity
    }))

    line_items.push({
      price_data: {
        currency:currency,
        product_data:{
          name: 'Delivery Charges'
        },
        unit_amount: deliveryCharge * 100
      },
      quantity:1
    })

    const session = await stripe.checkout.sessions.create({
      success_url: `${origin}/verify?success=true&orderId=${newOrder._id}`,
      cancel_url: `${origin}/verify?success=false&orderId=${newOrder._id}`,
      line_items,
      mode: 'payment'
    })

    res.json({success:true,session_url:session.url});
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message })
  }
}

// verify stripe
const verifyStripe = async (req,res) => {

  const { orderId, success, userId } = req.body

  try {
    if (success === "true") {
      await orderModel.findByIdAndUpdate(orderId,{payment:true});
      await userModel.findByIdAndUpdate(userId, {cartData:{}})
      res.json({success: true});
    }
    else{
      await orderModel.findByIdAndDelete(orderId)
      res.json({success:false})
    }
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message })
  }
}


// All orders data for admin panel 
const allOrders = async (req, res) => {
  try {
    const orders = await orderModel.find({}).select("items address amount paymentMethod payment date status cancelReason");

    res.json({ success: true, orders });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};


// User order Data for forntend
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

    // Prepare update data
    let updateData = { status };
    if (status === "Cancelled" && cancelReason) {
      updateData.cancelReason = cancelReason;
    }

    // Update order in the database
    const updatedOrder = await orderModel.findByIdAndUpdate(
      orderId,
      updateData,
      { new: true }
    );

    res.json({ success: true, message: "Status Updated", order: updatedOrder });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: error.message });
  }
};



export { verifyStripe,allOrders, placeOrder, placeOrderStripe, updateStatus, userOrders }