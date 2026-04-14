import mongoose from 'mongoose'

const wishlistShareSchema = new mongoose.Schema({
    userId: { type: String, required: true, index: true },
    shareToken: { type: String, required: true, unique: true, index: true },
    expiresAt: { type: Date, required: true }
}, { timestamps: true })

const wishlistShareModel = mongoose.models.wishlist_share || mongoose.model('wishlist_share', wishlistShareSchema)

export default wishlistShareModel
