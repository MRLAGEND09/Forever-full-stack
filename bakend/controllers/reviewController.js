import reviewModel from "../models/reviewModel.js";
import productModel from "../models/productModel.js";
import orderModel from "../models/orderModel.js";

// Add a review
const addReview = async (req, res) => {
    try {
        const { userId, productId, orderId, rating, comment, photoUrls = [] } = req.body;

        const order = await orderModel.findOne({ _id: orderId, userId }).lean()
        if (!order) {
            return res.json({ success: false, message: "Order not found for this user" })
        }

        const hasProduct = (order.items || []).some((item) => String(item._id || item.productId) === String(productId))
        if (!hasProduct) {
            return res.json({ success: false, message: "This product is not part of the selected order" })
        }

        const verifiedPurchase = ['Delivered', 'Shipped', 'Out For Delivery', 'Processing', 'Order Placed'].includes(order.status)

        // Check if user already reviewed this product from this specific order
        const existingReview = await reviewModel.findOne({ userId, productId, orderId });
        if (existingReview) {
            return res.json({ success: false, message: "You have already reviewed this product from this order" });
        }

        const review = new reviewModel({
            userId,
            productId,
            orderId,
            rating,
            comment,
            photoUrls: Array.isArray(photoUrls) ? photoUrls.slice(0, 4) : [],
            verifiedPurchase
        });

        await review.save();

        // Update product rating
        await updateProductRating(productId);

        res.json({ success: true, message: "Review added successfully" });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// Get reviews for a product
const getProductReviews = async (req, res) => {
    try {
        const { productId } = req.body;
        const reviews = await reviewModel.find({ productId }).populate('userId', 'name').sort({ date: -1 });
        res.json({ success: true, reviews });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// Update product rating based on reviews
const updateProductRating = async (productId) => {
    try {
        const reviews = await reviewModel.find({ productId });
        if (reviews.length > 0) {
            const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
            const averageRating = totalRating / reviews.length;
            await productModel.findByIdAndUpdate(productId, {
                rating: averageRating,
                reviewCount: reviews.length
            });
        }
    } catch (error) {
        console.log(error);
    }
};

// Get user's reviews
const getUserReviews = async (req, res) => {
    try {
        const { userId } = req.body;
        const reviews = await reviewModel.find({ userId }).populate('productId', 'name image').sort({ date: -1 });
        res.json({ success: true, reviews });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// Admin: List all reviews
const getAllReviews = async (req, res) => {
    try {
        const reviews = await reviewModel.find().populate('userId', 'name email').populate('productId', 'name').sort({ date: -1 });
        res.json({ success: true, reviews });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// Admin: Edit review
const editReview = async (req, res) => {
    try {
        const { reviewId, rating, comment } = req.body;
        const review = await reviewModel.findById(reviewId);
        if (!review) return res.json({ success: false, message: 'Review not found' });

        review.rating = rating ?? review.rating;
        review.comment = comment ?? review.comment;
        await review.save();

        await updateProductRating(review.productId);

        res.json({ success: true, message: 'Review updated' });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// Admin: Delete review
const deleteReview = async (req, res) => {
    try {
        const { reviewId } = req.body;
        const review = await reviewModel.findById(reviewId);
        if (!review) return res.json({ success: false, message: 'Review not found' });

        const productId = review.productId;
        await reviewModel.findByIdAndDelete(reviewId);

        await updateProductRating(productId);

        res.json({ success: true, message: 'Review deleted' });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

export { addReview, getProductReviews, getUserReviews, getAllReviews, editReview, deleteReview };