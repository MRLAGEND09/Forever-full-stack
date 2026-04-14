import { v2 as cloudinary } from 'cloudinary'
import productModel from '../models/productModel.js'
import orderModel from '../models/orderModel.js'
import userActivityModel from '../models/userActivityModel.js'
import searchAnalyticsModel from '../models/searchAnalyticsModel.js'

const SEARCH_TERM_MIN_LENGTH = 2
const CURRENCY_RATES = {
    BDT: 1,
    USD: 0.0082,
    INR: 0.68
}

const toPositiveNumber = (value, fallback = 0) => {
    const num = Number(value)
    return Number.isFinite(num) && num >= 0 ? num : fallback
}

const uniqueStrings = (values) => [...new Set((values || []).map((item) => String(item).trim()).filter(Boolean))]

const parseArrayParam = (value) => {
    if (!value) return []
    if (Array.isArray(value)) return uniqueStrings(value)
    return uniqueStrings(String(value).split(','))
}

const isFlashSaleHour = () => {
    const hour = new Date().getHours()
    return hour >= 20 || hour <= 2
}

const calculateDynamicPricing = (product, personalizedBoost = 0) => {
    const originalPrice = toPositiveNumber(product.price)
    const baseDiscount = product.discountActive ? toPositiveNumber(product.discount) : 0
    const flashDiscount = isFlashSaleHour() ? 6 : 0
    const personalizedDiscount = Math.min(Math.max(personalizedBoost, 0), 8)
    const totalDiscount = Math.min(baseDiscount + flashDiscount + personalizedDiscount, 55)
    const finalPrice = Number((originalPrice - (originalPrice * totalDiscount / 100)).toFixed(2))

    return {
        originalPrice,
        dynamicPrice: finalPrice,
        dynamicDiscountPercent: Number(totalDiscount.toFixed(2)),
        flashSale: flashDiscount > 0,
        pricingLabel: flashDiscount > 0 ? 'Flash deal active' : (personalizedDiscount > 0 ? 'Personalized deal' : 'Standard price')
    }
}

const scoreProductForUser = (product, activity, purchasedIdsSet = new Set()) => {
    let score = 0

    if (purchasedIdsSet.has(String(product._id))) score += 2

    const prefs = activity?.preferences || {}
    if ((prefs.categories || []).includes(product.category)) score += 4
    if ((prefs.brands || []).includes(product.brand)) score += 3
    if ((prefs.sizes || []).some((size) => (product.sizes || []).includes(size))) score += 2
    if ((prefs.colors || []).some((color) => (product.colors || []).includes(color))) score += 2

    score += Math.min(toPositiveNumber(product.rating), 5)
    score += Math.min(toPositiveNumber(product.reviewCount) / 20, 5)

    return score
}

const trackSearchTerm = async ({ term, userId = '' }) => {
    const normalizedTerm = String(term || '').trim().toLowerCase()
    if (normalizedTerm.length < SEARCH_TERM_MIN_LENGTH) return

    await searchAnalyticsModel.findOneAndUpdate(
        { term: normalizedTerm },
        { $inc: { count: 1 }, $set: { lastSearchedAt: new Date(), userId: String(userId || '') } },
        { upsert: true, new: true }
    )

    if (userId) {
        await userActivityModel.findOneAndUpdate(
            { userId: String(userId) },
            {
                $push: {
                    searchTerms: {
                        $each: [{ term: normalizedTerm, searchedAt: new Date() }],
                        $slice: -30
                    }
                }
            },
            { upsert: true, new: true }
        )
    }
}

// function for add product
const addProduct = async (req, res) => {
    try {
        const {
            name,
            description,
            price,
            category,
            subCategory,
            brand,
            colors,
            sizes,
            bestseller,
            discount,
            discountActive,
            collections,
            showInCollection,
            stock,
            reorderThreshold,
            reorderQuantity,
            regions,
            model3dUrl,
            virtualTryOnUrl,
            arSceneUrl
        } = req.body;

        const image1 = req.files.image1 && req.files.image1[0];
        const image2 = req.files.image2 && req.files.image2[0];
        const image3 = req.files.image3 && req.files.image3[0];
        const image4 = req.files.image4 && req.files.image4[0];

        const images = [image1, image2, image3, image4].filter((item) => item !== undefined);

        let imagesUrl = await Promise.all(
            images.map(async (item) => {
                let result = await cloudinary.uploader.upload(item.path, { resource_type: 'image' });
                return result.secure_url;
            })
        );

        const productData = {
            name,
            description,
            price: Number(price),
            category,
            subCategory,
            brand: String(brand || '').trim(),
            bestseller: bestseller === 'true' ? true : false,
            sizes: JSON.parse(sizes),
            colors: colors ? JSON.parse(colors) : [],
            image: imagesUrl,
            discount: Number(discount) || 0,
            discountActive: discountActive === 'true' ? true : false,
            collections: collections ? JSON.parse(collections) : [],
            showInCollection: showInCollection === 'true' ? true : false,
            stock: Number(stock) || 20,
            reorderThreshold: Number(reorderThreshold) || 5,
            reorderQuantity: Number(reorderQuantity) || 20,
            regions: regions ? JSON.parse(regions) : ['global'],
            model3dUrl: String(model3dUrl || '').trim(),
            virtualTryOnUrl: String(virtualTryOnUrl || '').trim(),
            arSceneUrl: String(arSceneUrl || '').trim(),
            date: Date.now()
        };

        const newProduct = new productModel(productData);
        await newProduct.save();

        res.json({ success: true, message: "Product added successfully" });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// function for list product
const listProduct = async (req, res) => {
    try {
        const Products = await productModel.find({});
        res.json({ success: true, Products });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// Advanced search with AI-like ranking and dynamic pricing
const searchProducts = async (req, res) => {
    try {
        const {
            q = '',
            category = '',
            subCategory = '',
            minPrice,
            maxPrice,
            minRating,
            brands = '',
            colors = '',
            sizes = '',
            sort = 'relevance',
            limit = 40,
            userId = ''
        } = req.query

        const query = {}
        if (category) query.category = category
        if (subCategory) query.subCategory = subCategory

        if (q) {
            query.$or = [
                { name: { $regex: q, $options: 'i' } },
                { description: { $regex: q, $options: 'i' } },
                { category: { $regex: q, $options: 'i' } },
                { subCategory: { $regex: q, $options: 'i' } },
                { brand: { $regex: q, $options: 'i' } }
            ]
        }

        const minPriceNum = toPositiveNumber(minPrice, -1)
        const maxPriceNum = toPositiveNumber(maxPrice, -1)
        if (minPriceNum >= 0 || maxPriceNum >= 0) {
            query.price = {}
            if (minPriceNum >= 0) query.price.$gte = minPriceNum
            if (maxPriceNum >= 0) query.price.$lte = maxPriceNum
        }

        const minRatingNum = toPositiveNumber(minRating, -1)
        if (minRatingNum >= 0) query.rating = { $gte: minRatingNum }

        const brandList = parseArrayParam(brands)
        if (brandList.length) query.brand = { $in: brandList }

        const colorList = parseArrayParam(colors)
        if (colorList.length) query.colors = { $in: colorList }

        const sizeList = parseArrayParam(sizes)
        if (sizeList.length) query.sizes = { $in: sizeList }

        let matchedProducts = await productModel.find(query).limit(Math.min(toPositiveNumber(limit, 40), 100)).lean()
        const activity = userId ? await userActivityModel.findOne({ userId: String(userId) }).lean() : null

        matchedProducts = matchedProducts.map((product) => {
            const personalizedBoost = activity ? Math.min(scoreProductForUser(product, activity), 8) : 0
            const pricing = calculateDynamicPricing(product, personalizedBoost > 4 ? 4 : 0)
            const relevanceScore = q
                ? [product.name, product.brand, product.category, product.subCategory]
                    .filter(Boolean)
                    .join(' ')
                    .toLowerCase()
                    .includes(String(q).toLowerCase())
                    ? 10 + personalizedBoost
                    : personalizedBoost
                : personalizedBoost

            return { ...product, ...pricing, relevanceScore }
        })

        if (sort === 'price-asc') matchedProducts.sort((a, b) => a.dynamicPrice - b.dynamicPrice)
        else if (sort === 'price-desc') matchedProducts.sort((a, b) => b.dynamicPrice - a.dynamicPrice)
        else if (sort === 'rating-desc') matchedProducts.sort((a, b) => toPositiveNumber(b.rating) - toPositiveNumber(a.rating))
        else matchedProducts.sort((a, b) => b.relevanceScore - a.relevanceScore)

        if (q) {
            await trackSearchTerm({ term: q, userId })
        }

        res.json({ success: true, products: matchedProducts })
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// Autocomplete suggestions
const autocompleteSearch = async (req, res) => {
    try {
        const { q = '' } = req.query
        const text = String(q).trim()
        if (text.length < SEARCH_TERM_MIN_LENGTH) {
            return res.json({ success: true, suggestions: [] })
        }

        const [productMatches, popularMatches] = await Promise.all([
            productModel.find({ name: { $regex: text, $options: 'i' } }).select('name brand category').limit(8).lean(),
            searchAnalyticsModel.find({ term: { $regex: text, $options: 'i' } }).sort({ count: -1 }).limit(6).lean()
        ])

        const suggestionSet = new Set()
        productMatches.forEach((item) => {
            if (item.name) suggestionSet.add(item.name)
            if (item.brand) suggestionSet.add(item.brand)
            if (item.category) suggestionSet.add(item.category)
        })
        popularMatches.forEach((item) => suggestionSet.add(item.term))

        res.json({ success: true, suggestions: [...suggestionSet].slice(0, 10) })
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

const getPopularSearches = async (req, res) => {
    try {
        const terms = await searchAnalyticsModel.find({}).sort({ count: -1, lastSearchedAt: -1 }).limit(10).lean()
        res.json({ success: true, terms })
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

const trackSearchAnalytics = async (req, res) => {
    try {
        const { term, userId = '' } = req.body
        await trackSearchTerm({ term, userId })
        res.json({ success: true })
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

const recordProductView = async (req, res) => {
    try {
        const { userId, productId } = req.body
        if (!userId || !productId) {
            return res.json({ success: false, message: 'userId and productId are required' })
        }

        const product = await productModel.findById(productId).lean()
        if (!product) {
            return res.json({ success: false, message: 'Product not found' })
        }

        const update = {
            $push: {
                recentlyViewed: {
                    $each: [{ productId: String(productId), viewedAt: new Date() }],
                    $slice: -30
                }
            },
            $addToSet: {
                'preferences.categories': product.category,
                'preferences.brands': product.brand || '',
                'preferences.sizes': { $each: uniqueStrings(product.sizes || []) },
                'preferences.colors': { $each: uniqueStrings(product.colors || []) }
            }
        }

        await userActivityModel.findOneAndUpdate({ userId: String(userId) }, update, { upsert: true, new: true })
        res.json({ success: true })
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

const getRecommendations = async (req, res) => {
    try {
        const { userId = '', productId = '' } = req.body

        const [allProducts, activity, orders] = await Promise.all([
            productModel.find({}).lean(),
            userId ? userActivityModel.findOne({ userId: String(userId) }).lean() : null,
            userId ? orderModel.find({ userId: String(userId) }).select('items').lean() : []
        ])

        const purchasedIdsSet = new Set()
        orders.forEach((order) => {
            (order.items || []).forEach((item) => {
                const id = String(item._id || item.productId || '').trim()
                if (id) purchasedIdsSet.add(id)
            })
        })

        const baseProduct = productId ? allProducts.find((item) => String(item._id) === String(productId)) : null

        const scored = allProducts
            .filter((item) => String(item._id) !== String(productId || ''))
            .map((product) => {
                let score = scoreProductForUser(product, activity, purchasedIdsSet)

                if (baseProduct) {
                    if (baseProduct.category === product.category) score += 4
                    if (baseProduct.subCategory === product.subCategory) score += 3
                    if (baseProduct.brand && baseProduct.brand === product.brand) score += 2
                }

                const personalizedBoost = Math.min(score, 8)
                const pricing = calculateDynamicPricing(product, personalizedBoost > 4 ? 4 : 0)
                return { ...product, ...pricing, score }
            })
            .sort((a, b) => b.score - a.score)

        const customersAlsoBought = scored.filter((item) => purchasedIdsSet.has(String(item._id))).slice(0, 8)
        const similarProducts = scored.slice(0, 8)

        res.json({ success: true, customersAlsoBought, similarProducts })
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

const personalizedHome = async (req, res) => {
    try {
        const { userId } = req.body
        if (!userId) {
            return res.json({ success: false, message: 'userId is required' })
        }

        const [products, activity] = await Promise.all([
            productModel.find({}).lean(),
            userActivityModel.findOne({ userId: String(userId) }).lean()
        ])

        const recentViewIds = (activity?.recentlyViewed || []).slice(-6).map((item) => String(item.productId))
        const recentSet = new Set(recentViewIds)

        const recentlyViewed = recentViewIds
            .map((id) => products.find((item) => String(item._id) === id))
            .filter(Boolean)
            .map((product) => ({ ...product, ...calculateDynamicPricing(product, 4) }))

        const personalized = products
            .filter((item) => !recentSet.has(String(item._id)))
            .map((product) => {
                const score = scoreProductForUser(product, activity)
                return { ...product, ...calculateDynamicPricing(product, score > 4 ? 4 : 0), score }
            })
            .sort((a, b) => b.score - a.score)
            .slice(0, 10)

        const trending = products
            .slice()
            .sort((a, b) => (toPositiveNumber(b.reviewCount) + toPositiveNumber(b.rating)) - (toPositiveNumber(a.reviewCount) + toPositiveNumber(a.rating)))
            .slice(0, 8)
            .map((product) => ({ ...product, ...calculateDynamicPricing(product, 2) }))

        res.json({ success: true, personalized, recentlyViewed, trending })
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

const getLocalizedProducts = async (req, res) => {
    try {
        const { region = 'global', language = 'en' } = req.query
        const products = await productModel.find({
            $or: [
                { regions: { $in: [region] } },
                { regions: { $in: ['global'] } },
                { regions: { $exists: false } },
                { regions: { $size: 0 } }
            ]
        }).lean()

        res.json({ success: true, region, language, products })
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

const getCurrencyConfig = async (req, res) => {
    try {
        res.json({
            success: true,
            base: 'BDT',
            symbols: { BDT: '৳', USD: '$', INR: '₹' },
            rates: CURRENCY_RATES
        })
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

const createAffiliateLink = async (req, res) => {
    try {
        const { userId = '', productId } = req.body
        if (!productId) {
            return res.json({ success: false, message: 'productId is required' })
        }

        const ref = Buffer.from(`${String(userId || 'guest')}:${String(productId)}:${Date.now()}`).toString('base64url')
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173'
        const shareUrl = `${frontendUrl}/product/${productId}?ref=${ref}`

        res.json({ success: true, shareUrl, ref })
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

const getSizeRecommendation = async (req, res) => {
    try {
        const { userId, productId } = req.body
        const product = await productModel.findById(productId).lean()
        if (!product) {
            return res.json({ success: false, message: 'Product not found' })
        }

        const orders = await orderModel.find({ userId }).select('items').lean()
        const sizeCounter = new Map()

        orders.forEach((order) => {
            (order.items || []).forEach((item) => {
                const size = String(item.size || '').trim()
                if (!size) return
                sizeCounter.set(size, (sizeCounter.get(size) || 0) + 1)
            })
        })

        const available = (product.sizes || []).map((size) => String(size))
        const ranked = [...sizeCounter.entries()]
            .filter(([size]) => available.includes(size))
            .sort((a, b) => b[1] - a[1])

        const recommendedSize = ranked.length ? ranked[0][0] : (available[0] || '')
        const confidence = ranked.length ? Math.min(95, 55 + ranked[0][1] * 8) : 45

        res.json({ success: true, recommendedSize, confidence })
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// function for removing product
const removeProduct = async (req, res) => {
    try {
        await productModel.findByIdAndDelete(req.body.id)
        res.json({ success: true, message: "product removed successfully" });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

// function for single product
const singleProduct = async (req, res) => {
    try {
        const { productId } = req.body;
        const product = await productModel.findById(productId);
        res.json({ success: true, product });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

// function for update product discount
const updateDiscount = async (req, res) => {
    try {
        const { productId, discount, discountActive } = req.body;
        await productModel.findByIdAndUpdate(productId, {
            discount: Number(discount),
            discountActive: discountActive
        })
        res.json({ success: true, message: "Discount updated successfully" })
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message })
    }
}

// function for update product collection
const updateCollection = async (req, res) => {
    try {
        const { productId, collections, showInCollection } = req.body;
        await productModel.findByIdAndUpdate(productId, {
            collections: collections || [],
            showInCollection: showInCollection
        })
        res.json({ success: true, message: "Collection updated successfully" })
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message })
    }
}

export {
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
}