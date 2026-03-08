import subscriberModel from '../models/subscriberModel.js'
import nodemailer from 'nodemailer'

// Random coupon code generate
const generateCoupon = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let code = 'FOREVER-'
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return code
}

// Email sender
const sendEmail = async (email, couponCode, expiresAt) => {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    })

    await transporter.sendMail({
        from: `"Forever Fashion" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: '🎉 Your 20% Off Coupon - Forever Fashion',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h1 style="color: #333;">Welcome to Forever Fashion! 🎉</h1>
                <p>Thank you for subscribing!</p>
                <p>You will receive a <strong>20% discount</strong> on your 2nd order.</p>
                <div style="background: #f4f4f4; padding: 20px; text-align: center; margin: 20px 0;">
                    <h2 style="color: #333;">Your Coupon Code:</h2>
                    <h1 style="color: #e63946; letter-spacing: 3px;">${couponCode}</h1>
                </div>
                <p style="color: red;">⚠️ This coupon can only be used <strong>once</strong>.</p>
                <p style="color: red;">⚠️ Valid until: <strong>${new Date(expiresAt).toDateString()}</strong></p>
                <p>Happy Shopping! 🛍️</p>
                <p><strong>Forever Fashion Team</strong></p>
            </div>
        `
    })
}

// Subscribe controller
const subscribeUser = async (req, res) => {
    try {
        const { email } = req.body

        const existing = await subscriberModel.findOne({ email })
        if (existing) {
            return res.json({ success: false, message: 'You have already subscribed with this email!' })
        }

        const couponCode = generateCoupon()
        const expiresAt = new Date()
        expiresAt.setMonth(expiresAt.getMonth() + 2)

        const subscriber = new subscriberModel({ email, couponCode, expiresAt })
        await subscriber.save()

        await sendEmail(email, couponCode, expiresAt)

        res.json({ success: true, message: 'Subscription successful! Please check your email for the coupon.' })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// Validate coupon
const validateCoupon = async (req, res) => {
    try {
        const { couponCode } = req.body

        const subscriber = await subscriberModel.findOne({ couponCode })

        if (!subscriber) {
            return res.json({ success: false, message: 'Invalid coupon code!' })
        }
        if (subscriber.isUsed) {
            return res.json({ success: false, message: 'This coupon has already been used!' })
        }
        if (new Date() > subscriber.expiresAt) {
            return res.json({ success: false, message: 'Coupon expired!' })
        }

        res.json({ success: true, message: '20% discount applied!', discount: 20 })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// Mark coupon as used
const useCoupon = async (req, res) => {
    try {
        const { couponCode } = req.body
        await subscriberModel.findOneAndUpdate({ couponCode }, { isUsed: true })
        res.json({ success: true })
    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}

export { subscribeUser, validateCoupon, useCoupon }