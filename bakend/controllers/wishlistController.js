import wishlistModel from "../models/wishlistModel.js";
import productModel from "../models/productModel.js";
import wishlistShareModel from "../models/wishlistShareModel.js";

// Add to wishlist
const addToWishlist = async (req, res) => {
    try {
        const { userId, productId } = req.body;

        // Check if already in wishlist
        const existingItem = await wishlistModel.findOne({ userId, productId });
        if (existingItem) {
            return res.json({ success: false, message: "Product already in wishlist" });
        }

        const wishlistItem = new wishlistModel({
            userId,
            productId
        });

        await wishlistItem.save();
        res.json({ success: true, message: "Added to wishlist" });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// Remove from wishlist
const removeFromWishlist = async (req, res) => {
    try {
        const { userId, productId } = req.body;

        await wishlistModel.findOneAndDelete({ userId, productId });
        res.json({ success: true, message: "Removed from wishlist" });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// Get user's wishlist
const getUserWishlist = async (req, res) => {
    try {
        const { userId } = req.body;
        const wishlistItems = await wishlistModel.find({ userId }).populate('productId');
        res.json({ success: true, wishlist: wishlistItems });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// Check if product is in wishlist
const checkWishlist = async (req, res) => {
    try {
        const { userId, productId } = req.body;
        const item = await wishlistModel.findOne({ userId, productId });
        res.json({ success: true, inWishlist: !!item });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

const createWishlistShareLink = async (req, res) => {
    try {
        const { userId } = req.body
        const shareToken = Buffer.from(`${userId}:${Date.now()}`).toString('base64url')
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

        await wishlistShareModel.findOneAndUpdate(
            { userId: String(userId) },
            { shareToken, expiresAt },
            { upsert: true, new: true }
        )

        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173'
        const shareUrl = `${frontendUrl}/wishlist?share=${shareToken}`
        res.json({ success: true, shareUrl, expiresAt })
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

const getSharedWishlist = async (req, res) => {
    try {
        const { shareToken } = req.body
        const share = await wishlistShareModel.findOne({ shareToken }).lean()
        if (!share || new Date(share.expiresAt) < new Date()) {
            return res.json({ success: false, message: 'Share link expired or invalid' })
        }

        const wishlistItems = await wishlistModel.find({ userId: share.userId }).populate('productId').lean()
        res.json({ success: true, wishlist: wishlistItems })
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

export { addToWishlist, removeFromWishlist, getUserWishlist, checkWishlist, createWishlistShareLink, getSharedWishlist };