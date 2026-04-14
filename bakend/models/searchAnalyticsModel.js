import mongoose from 'mongoose'

const searchAnalyticsSchema = new mongoose.Schema({
    term: { type: String, required: true, index: true, lowercase: true, trim: true },
    count: { type: Number, default: 1 },
    lastSearchedAt: { type: Date, default: Date.now },
    userId: { type: String, default: '' }
}, { timestamps: true })

searchAnalyticsSchema.index({ term: 1 }, { unique: true })

const searchAnalyticsModel = mongoose.models.search_analytics || mongoose.model('search_analytics', searchAnalyticsSchema)

export default searchAnalyticsModel
