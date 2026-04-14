import abandonedCartModel from '../models/abandonedCartModel.js'
import userModel from '../models/userModel.js'
import nodemailer from 'nodemailer'

const saveAbandonedCart = async (req, res) => {
    try {
        const { userId, items, amount } = req.body
        await abandonedCartModel.findOneAndUpdate(
            { userId },
            { userId, items, amount, createdAt: Date.now(), status: 'abandoned' },
            { upsert: true, new: true }
        )
        res.json({ success: true })
    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}

const clearAbandonedCart = async (req, res) => {
    try {
        const { userId } = req.body
        await abandonedCartModel.findOneAndDelete({ userId })
        res.json({ success: true })
    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}

const getAbandonedCarts = async (req, res) => {
    try {
        const carts = await abandonedCartModel.find({ status: 'abandoned' }).sort({ createdAt: -1 })
        res.json({ success: true, carts })
    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}

const sendAbandonedCartReminders = async (req, res) => {
    try {
        const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000)
        const carts = await abandonedCartModel.find({
            status: 'abandoned',
            reminderSent: false,
            createdAt: { $lte: twoHoursAgo }
        }).lean()

        if (!carts.length) {
            return res.json({ success: true, sent: 0 })
        }

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        })

        let sent = 0
        for (const cart of carts) {
            const user = await userModel.findById(cart.userId).select('email name').lean()
            if (!user?.email) continue

            try {
                await transporter.sendMail({
                    from: `"BLOOP" <${process.env.EMAIL_USER}>`,
                    to: user.email,
                    subject: 'You left something in your cart',
                    html: `<p>Hi ${user.name || 'there'}, your cart is waiting for you. Complete your order now and don\'t miss out.</p>`
                })
                sent += 1
                await abandonedCartModel.updateOne(
                    { _id: cart._id },
                    { reminderSent: true, remindedAt: new Date() }
                )
            } catch (mailError) {
                console.log('Reminder mail error:', mailError.message)
            }
        }

        res.json({ success: true, sent })
    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}

export { saveAbandonedCart, clearAbandonedCart, getAbandonedCarts, sendAbandonedCartReminders }