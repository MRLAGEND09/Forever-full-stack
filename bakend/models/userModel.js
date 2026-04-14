import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
{
    name: {
        type: String,
        required: true,
        trim: true
    },

    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },

    password: {
        type: String,
        default: ""
    },

    avatar: {
        type: String,
        default: ""
    },

    provider: {
        type: String,
        enum: ["manual", "google", "facebook", "instagram"],
        default: "manual"
    },

    address: {
        street: { type: String, default: '' },
        city: { type: String, default: '' },
        state: { type: String, default: '' },
        zipcode: { type: String, default: '' },
        country: { type: String, default: '' },
        phone: { type: String, default: '' }
    },

    cartData: {
        type: Object,
        default: {}
    },

    addresses: {
        type: [{
            label: { type: String, default: 'Home' },
            street: { type: String, default: '' },
            city: { type: String, default: '' },
            state: { type: String, default: '' },
            zipcode: { type: String, default: '' },
            country: { type: String, default: '' },
            phone: { type: String, default: '' }
        }],
        default: []
    },

    preferredCurrency: {
        type: String,
        default: 'BDT'
    },

    preferredLanguage: {
        type: String,
        default: 'en'
    },

    preferredRegion: {
        type: String,
        default: 'global'
    },

    savedPaymentMethods: {
        type: [{
            type: { type: String, default: 'card' },
            provider: { type: String, default: 'stripe' },
            last4: { type: String, default: '' },
            brand: { type: String, default: '' },
            holderName: { type: String, default: '' },
            isDefault: { type: Boolean, default: false }
        }],
        default: []
    }

},
{
    minimize: false,
    timestamps: true
});

const userModel = mongoose.models.user || mongoose.model("user", userSchema);

export default userModel;