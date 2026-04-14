import mongoose from 'mongoose'

const abTestEventSchema = new mongoose.Schema({
    testKey: { type: String, required: true, index: true },
    variant: { type: String, required: true },
    userId: { type: String, default: '' },
    event: { type: String, default: 'impression' },
    metadata: { type: Object, default: {} }
}, { timestamps: true })

const abTestEventModel = mongoose.models.ab_test_event || mongoose.model('ab_test_event', abTestEventSchema)

export default abTestEventModel
