import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    image: { type: Array, required: true },
    category: { type: String, required: true },
    subCategory: { type: String, required: true },
    brand: { type: String, default: '' },
    colors: { type: [String], default: [] },
    sizes: { type: Array, required: true },
    stock: { type: Number, default: 20 },
    reorderThreshold: { type: Number, default: 5 },
    reorderQuantity: { type: Number, default: 20 },
    bestseller: { type: Boolean, default: false },
    discount: { type: Number, default: 0 },
    discountActive: { type: Boolean, default: false },
    rating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
    date: { type: Number, required: true },

    // Collection tags
    collections: { 
        type: [String], 
        default: [],
        enum: ['latest', 'jacket', 'bloop', 'bestseller', 'boss', 'lacoste', 'ralph-lauren', '']
    },

    // Show in Collection page
    showInCollection: { type: Boolean, default: false },

    // Region/localized merchandising
    regions: { type: [String], default: ['global'] },

    // AR/VR and enhanced PDP assets
    model3dUrl: { type: String, default: '' },
    virtualTryOnUrl: { type: String, default: '' },
    arSceneUrl: { type: String, default: '' },
})

const productModel = mongoose.models.product || mongoose.model("product", productSchema);

export default productModel