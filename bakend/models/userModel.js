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
        enum: ["manual", "google", "facebook"],
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
    }

},
{
    minimize: false,
    timestamps: true
});

const userModel = mongoose.models.user || mongoose.model("user", userSchema);

export default userModel;