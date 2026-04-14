import mongoose from 'mongoose'

const abandonedCartSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    items: { type: Array, required: true },
    amount: { type: Number, required: true },
    createdAt: { type: Date, default: Date.now },
    status: { type: String, default: 'abandoned' },
    reminderSent: { type: Boolean, default: false },
    remindedAt: { type: Date, default: null }
})

const abandonedCartModel = mongoose.models.abandonedCart || mongoose.model('abandonedCart', abandonedCartSchema)

export default abandonedCartModel