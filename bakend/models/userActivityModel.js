import mongoose from 'mongoose'

const userActivitySchema = new mongoose.Schema({
    userId: { type: String, required: true, unique: true, index: true },
    recentlyViewed: {
        type: [{
            productId: { type: String, required: true },
            viewedAt: { type: Date, default: Date.now }
        }],
        default: []
    },
    searchTerms: {
        type: [{
            term: { type: String, required: true },
            searchedAt: { type: Date, default: Date.now }
        }],
        default: []
    },
    preferences: {
        brands: { type: [String], default: [] },
        colors: { type: [String], default: [] },
        categories: { type: [String], default: [] },
        sizes: { type: [String], default: [] }
    }
}, { timestamps: true })

const userActivityModel = mongoose.models.user_activity || mongoose.model('user_activity', userActivitySchema)

export default userActivityModel
