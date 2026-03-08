import mongoose from 'mongoose'

const subscriberSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    couponCode: { type: String, required: true },
    isUsed: { type: Boolean, default: false },
    expiresAt: { type: Date, required: true },
    createdAt: { type: Date, default: Date.now }
})

const subscriberModel = mongoose.models.subscriber || mongoose.model('subscriber', subscriberSchema)

export default subscriberModel