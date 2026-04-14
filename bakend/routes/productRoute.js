import express from 'express'
import {
    listProduct,
    addProduct,
    removeProduct,
    singleProduct,
    updateDiscount,
    updateCollection,
    searchProducts,
    autocompleteSearch,
    getPopularSearches,
    trackSearchAnalytics,
    recordProductView,
    getRecommendations,
    personalizedHome,
    getLocalizedProducts,
    getCurrencyConfig,
    createAffiliateLink,
    getSizeRecommendation
} from '../controllers/productController.js'
import upload from '../middleware/multer.js';
import adminAuth from '../middleware/adminAuth.js';
import authUser from '../middleware/auth.js'

const productRouter = express.Router();

productRouter.post('/add', adminAuth, upload.fields([
    { name: 'image1', maxCount: 1 },
    { name: 'image2', maxCount: 1 },
    { name: 'image3', maxCount: 1 },
    { name: 'image4', maxCount: 1 }
]), addProduct);
productRouter.post('/remove', adminAuth, removeProduct);
productRouter.post('/single', singleProduct);
productRouter.get('/list', listProduct)
productRouter.get('/search', searchProducts)
productRouter.get('/autocomplete', autocompleteSearch)
productRouter.get('/popular-searches', getPopularSearches)
productRouter.get('/localized', getLocalizedProducts)
productRouter.get('/currency-config', getCurrencyConfig)
productRouter.post('/track-search', trackSearchAnalytics)
productRouter.post('/track-view', authUser, recordProductView)
productRouter.post('/recommendations', getRecommendations)
productRouter.post('/personalized-home', authUser, personalizedHome)
productRouter.post('/affiliate-link', authUser, createAffiliateLink)
productRouter.post('/size-recommendation', authUser, getSizeRecommendation)
productRouter.post('/update-discount', adminAuth, updateDiscount)
productRouter.post('/update-collection', adminAuth, updateCollection)

export default productRouter