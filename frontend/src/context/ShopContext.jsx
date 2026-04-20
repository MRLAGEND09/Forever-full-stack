import { createContext, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import axios from 'axios'
import {
    clearPersistedState,
    persistCartItems,
    persistRecentlyViewed,
    persistSearchFilters,
    persistToken,
    persistUserInfo,
    persistWishlist,
    readPersistedCartItems,
    readPersistedRecentlyViewed,
    readPersistedSearchFilters,
    readPersistedToken,
    readPersistedUserInfo,
    readPersistedWishlist
} from '../utils/persistedState'

export const backendUrl = import.meta.env.VITE_BACKEND_URL
export const ShopContext = createContext();

const TRANSLATIONS = {
    en: {
        home: 'HOME',
        collection: 'COLLECTION',
        contact: 'CONTACT',
        about: 'ABOUT',
        searchPlaceholder: 'Search products, brands, colors...'
    },
    bn: {
        home: 'হোম',
        collection: 'কালেকশন',
        contact: 'যোগাযোগ',
        about: 'সম্পর্কে',
        searchPlaceholder: 'পণ্য, ব্র্যান্ড, রঙ খুঁজুন...'
    },
    hi: {
        home: 'होम',
        collection: 'कलेक्शन',
        contact: 'संपर्क',
        about: 'हमारे बारे में',
        searchPlaceholder: 'प्रोडक्ट, ब्रांड, रंग खोजें...'
    }
}

const ShopContextProvider = (props) => {
    const storedFilters = readPersistedSearchFilters()

    const [selectedCurrency, setSelectedCurrency] = useState(localStorage.getItem('currency') || 'BDT');
    const [currencySymbol, setCurrencySymbol] = useState('৳');
    const [currencyRates, setCurrencyRates] = useState({ BDT: 1, USD: 0.0082, INR: 0.68 });
    const [selectedLanguage, setSelectedLanguage] = useState(localStorage.getItem('language') || 'en');
    const [selectedRegion, setSelectedRegion] = useState(localStorage.getItem('region') || 'global');
    const currency = currencySymbol;
    const delivery_fee = 70;
    const [search, setSearch] = useState(storedFilters.search || '');
    const [showSearch, setShowSearch] = useState(Boolean(storedFilters.showSearch));
    const [products, setProducts] = useState([]);
    const [token, setToken] = useState(() => readPersistedToken());
    const [cartItems, setCartItems] = useState(() => readPersistedCartItems());
    const [userInfo, setUserInfo] = useState(() => readPersistedUserInfo());
    const [wishlist, setWishlist] = useState(() => readPersistedWishlist());
    const [isAuthLoaded, setIsAuthLoaded] = useState(false);
    const [autocompleteSuggestions, setAutocompleteSuggestions] = useState([]);
    const [popularSearchTerms, setPopularSearchTerms] = useState([]);
    const [personalizedHomeData, setPersonalizedHomeData] = useState({ personalized: [], recentlyViewed: readPersistedRecentlyViewed(), trending: [] });

    const navigate = useNavigate();

    const t = (key) => TRANSLATIONS[selectedLanguage]?.[key] || TRANSLATIONS.en[key] || key

    const convertPrice = (amount) => {
        const numeric = Number(amount) || 0
        const rate = Number(currencyRates[selectedCurrency] || 1)
        return Number((numeric * rate).toFixed(2))
    }

    const updateUserPreferences = async (prefs = {}) => {
        if (!token) return
        try {
            await axios.post(backendUrl + '/api/user/preferences', prefs, { headers: { token } })
        } catch (error) {
            console.log(error)
        }
    }

    const updateCurrency = (code) => {
        setSelectedCurrency(code)
        localStorage.setItem('currency', code)
        const symbols = { BDT: '৳', USD: '$', INR: '₹' }
        setCurrencySymbol(symbols[code] || '৳')
        updateUserPreferences({ preferredCurrency: code })
    }

    const updateLanguage = (code) => {
        setSelectedLanguage(code)
        localStorage.setItem('language', code)
        updateUserPreferences({ preferredLanguage: code })
    }

    const updateRegion = (region) => {
        setSelectedRegion(region)
        localStorage.setItem('region', region)
        updateUserPreferences({ preferredRegion: region })
    }

    const fetchCurrencyConfig = async () => {
        try {
            const response = await axios.get(backendUrl + '/api/product/currency-config')
            if (response.data.success) {
                setCurrencyRates(response.data.rates || { BDT: 1, USD: 0.0082, INR: 0.68 })
                const symbols = response.data.symbols || { BDT: '৳', USD: '$', INR: '₹' }
                setCurrencySymbol(symbols[selectedCurrency] || '৳')
            }
        } catch (error) {
            console.log(error)
        }
    }

    // ----- Add to cart -----
    const addToCart = async (itemId, size) => {
        if (!size) {
            toast.error('Select Product Size');
            return;
        }

        let cartData = structuredClone(cartItems);

        if (cartData[itemId]) {
            if (cartData[itemId][size]) {
                cartData[itemId][size] += 1;
            } else {
                cartData[itemId][size] = 1;
            }
        } else {
            cartData[itemId] = {};
            cartData[itemId][size] = 1;
        }
        setCartItems(cartData)
        toast.success('Item added to cart! 🛍️');

        if (token) {
            try {
                await axios.post(backendUrl + '/api/cart/add', { itemId, size }, { headers: { token } })
            } catch (error) {
                console.log(error);
                toast.error(error.message)
            }
        }
    }

    // ----- Get total cart count -----
    const getCartCount = () => {
        let totalCount = 0;
        for (const items in cartItems) {
            for (const item in cartItems[items]) {
                try {
                    if (cartItems[items][item] > 0) {
                        totalCount += cartItems[items][item];
                    }
                } catch (error) { }
            }
        }
        return totalCount;
    }

    // ----- Update product quantity -----
    const updateQuantity = async (itemId, size, quantity) => {
        let cartData = structuredClone(cartItems);
        cartData[itemId][size] = quantity;
        setCartItems(cartData);

        if (token) {
            try {
                await axios.post(backendUrl + '/api/cart/update', { itemId, size, quantity }, { headers: { token } })
            } catch (error) {
                console.log(error);
                toast.error(error.message)
            }
        }
    }

    // ----- Get product price (with discount) -----
    const getProductPrice = (product) => {
        if (product.discountActive && product.discount > 0) {
            return product.price - (product.price * product.discount / 100)
        }
        return product.price
    }

    // ----- Get total cart amount -----
    const getCartAmount = () => {
        let totalAmount = 0;
        for (const items in cartItems) {
            let itemInfo = products.find((product) => product._id === items);
            for (const item in cartItems[items]) {
                try {
                    if (cartItems[items][item] > 0) {
                        const price = getProductPrice(itemInfo)
                        totalAmount += price * cartItems[items][item]
                    }
                } catch (error) { }
            }
        }
        return totalAmount;
    }

    // ----- Fetch products -----
    const getProductsData = async () => {
        try {
            const response = await axios.get(`${backendUrl}/api/product/localized?region=${selectedRegion}&language=${selectedLanguage}`);
            if (response.data.success) {
                setProducts(response.data.products || response.data.Products || []);
            } else {
                toast.error(response.data.message);
            }
        } catch (error) {
            console.log(error)
            toast.error(error.message)
        }
    }

    const searchProductsAdvanced = async (filters = {}) => {
        try {
            const params = new URLSearchParams()
            const mergedFilters = { ...filters }
            if (!mergedFilters.userId && userInfo?._id) {
                mergedFilters.userId = userInfo._id
            }
            Object.entries(mergedFilters).forEach(([key, value]) => {
                if (value === undefined || value === null || value === '') return
                if (Array.isArray(value) && value.length === 0) return
                params.append(key, Array.isArray(value) ? value.join(',') : value)
            })

            const tokenHeader = token ? { headers: { token } } : {}
            const response = await axios.get(`${backendUrl}/api/product/search?${params.toString()}`, tokenHeader)
            if (response.data.success) {
                return response.data.products || []
            }
            toast.error(response.data.message || 'Search failed')
            return []
        } catch (error) {
            console.log(error)
            toast.error(error.message)
            return []
        }
    }

    const fetchAutocompleteSuggestions = async (query) => {
        try {
            if (!query || query.trim().length < 2) {
                setAutocompleteSuggestions([])
                return []
            }
            const response = await axios.get(`${backendUrl}/api/product/autocomplete?q=${encodeURIComponent(query)}`)
            if (response.data.success) {
                const suggestions = response.data.suggestions || []
                setAutocompleteSuggestions(suggestions)
                return suggestions
            }
            return []
        } catch (error) {
            console.log(error)
            return []
        }
    }

    const trackSearchTerm = async (term) => {
        try {
            if (!term || term.trim().length < 2) return
            await axios.post(backendUrl + '/api/product/track-search', { term, userId: userInfo?._id || '' })
        } catch (error) {
            console.log(error)
        }
    }

    const fetchPopularSearchTerms = async () => {
        try {
            const response = await axios.get(backendUrl + '/api/product/popular-searches')
            if (response.data.success) {
                setPopularSearchTerms(response.data.terms || [])
            }
        } catch (error) {
            console.log(error)
        }
    }

    const trackProductView = async (productId, productData = null) => {
        const viewedProduct = productData || products.find((item) => item._id === productId)

        if (viewedProduct) {
            setPersonalizedHomeData((prev) => ({
                ...prev,
                recentlyViewed: [viewedProduct, ...(prev.recentlyViewed || []).filter((item) => item?._id !== viewedProduct._id)].slice(0, 12)
            }))
        }

        if (!token) return
        try {
            await axios.post(backendUrl + '/api/product/track-view', { productId }, { headers: { token } })
        } catch (error) {
            console.log(error)
        }
    }

    const getRecommendations = async (productId = '') => {
        try {
            const response = await axios.post(backendUrl + '/api/product/recommendations', {
                productId,
                userId: userInfo?._id || ''
            })
            if (response.data.success) return response.data
            return { customersAlsoBought: [], similarProducts: [] }
        } catch (error) {
            console.log(error)
            return { customersAlsoBought: [], similarProducts: [] }
        }
    }

    const fetchPersonalizedHomeData = async (authToken = token) => {
        if (!authToken) return
        try {
            const response = await axios.post(backendUrl + '/api/product/personalized-home', {}, { headers: { token: authToken } })
            if (response.data.success) {
                setPersonalizedHomeData((prev) => ({
                    personalized: response.data.personalized || [],
                    recentlyViewed: response.data.recentlyViewed || prev.recentlyViewed || [],
                    trending: response.data.trending || []
                }))
            }
        } catch (error) {
            console.log(error)
        }
    }

    const askAiAssistant = async (message) => {
        if (!token) {
            return { success: false, reply: 'Please login first to chat with BLOOP AI.' }
        }

        try {
            const response = await axios.post(backendUrl + '/api/ai/chat', { message }, { headers: { token } })
            return response.data
        } catch (error) {
            console.log(error)
            return { success: false, reply: 'Network issue. Please try again.' }
        }
    }

    const getAiSupportStatus = async () => {
        if (!token) {
            return { success: false, status: 'done' }
        }

        try {
            const response = await axios.post(backendUrl + '/api/ai/chat-status', {}, { headers: { token } })
            return response.data
        } catch (error) {
            console.log(error)
            return { success: false, status: 'done' }
        }
    }

    const getActiveSupportChat = async () => {
        if (!token) {
            return { success: false, status: 'done', messages: [] }
        }

        try {
            const response = await axios.get(backendUrl + '/api/user/chat', { headers: { token } })
            return response.data
        } catch (error) {
            console.log(error)
            return { success: false, status: 'done', messages: [] }
        }
    }


    const getAbVariant = async (testKey = 'homepage-layout') => {
        try {
            const response = await axios.post(backendUrl + '/api/analytics/ab/variant', {
                testKey,
                userId: userInfo?._id || '',
                sessionId: localStorage.getItem('ab-session') || ''
            })
            if (response.data.success) {
                return response.data.variant
            }
        } catch (error) {
            console.log(error)
        }
        return 'A'
    }

    // ----- Fetch user cart -----
    const getUserCart = async (token) => {
        try {
            const response = await axios.post(backendUrl + '/api/cart/get', {}, { headers: { token } })
            if (response.data.success) {
                setCartItems(response.data.cartData)
            }
        } catch (error) {
            console.log(error);
            toast.error(error.message)
        }
    }

    // ----- Fetch user info -----
    const getUserInfo = async (token) => {
        try {
            const response = await axios.post(backendUrl + '/api/user/profile', {}, { headers: { token } })
            if (response.data.success) {
                setUserInfo(response.data.user)
            }
        } catch (error) {
            console.log(error)
        }
    }

    // ----- Wishlist functions -----
    const addToWishlist = async (productId) => {
        if (!token) {
            toast.error('Please login to add to wishlist')
            return
        }

        try {
            const response = await axios.post(backendUrl + '/api/wishlist/add', { productId }, { headers: { token } })
            if (response.data.success) {
                toast.success('Added to wishlist! ❤️')
                getUserWishlist()
            } else {
                toast.error(response.data.message)
            }
        } catch (error) {
            toast.error(error.message)
        }
    }

    const removeFromWishlist = async (productId) => {
        try {
            const response = await axios.post(backendUrl + '/api/wishlist/remove', { productId }, { headers: { token } })
            if (response.data.success) {
                toast.success('Removed from wishlist')
                getUserWishlist()
            } else {
                toast.error(response.data.message)
            }
        } catch (error) {
            toast.error(error.message)
        }
    }

    const getUserWishlist = async (authToken = token) => {
        if (!authToken) return
        try {
            const response = await axios.post(backendUrl + '/api/wishlist/get', {}, { headers: { token: authToken } })
            if (response.data.success) {
                setWishlist(response.data.wishlist)
            }
        } catch (error) {
            console.log(error)
        }
    }

    const isInWishlist = (productId) => {
        return wishlist.some(item => item.productId._id === productId)
    }

    const createWishlistShareLink = async () => {
        if (!token) return ''
        try {
            const response = await axios.post(backendUrl + '/api/wishlist/share', {}, { headers: { token } })
            if (response.data.success) {
                return response.data.shareUrl
            }
        } catch (error) {
            console.log(error)
        }
        return ''
    }

    const fetchSharedWishlist = async (shareToken) => {
        try {
            const response = await axios.post(backendUrl + '/api/wishlist/shared', { shareToken })
            if (response.data.success) return response.data.wishlist || []
        } catch (error) {
            console.log(error)
        }
        return []
    }

    const clearPersistedCustomerState = () => {
        clearPersistedState()
        setToken('')
        setCartItems({})
        setUserInfo(null)
        setWishlist([])
        setSearch('')
        setShowSearch(false)
        setPersonalizedHomeData({ personalized: [], recentlyViewed: [], trending: [] })
    }

    useEffect(() => {
        getProductsData()
        fetchPopularSearchTerms()
        fetchCurrencyConfig()
        setIsAuthLoaded(true)
    }, [])

    useEffect(() => {
        getProductsData()
    }, [selectedRegion, selectedLanguage])

    useEffect(() => {
        if (token) {
            persistToken(token)
            getUserCart(token)
            getUserInfo(token)
            getUserWishlist(token)
            fetchPersonalizedHomeData(token)
        }
    }, [token])

    useEffect(() => {
        persistCartItems(cartItems)
    }, [cartItems])

    useEffect(() => {
        persistUserInfo(userInfo)
    }, [userInfo])

    useEffect(() => {
        persistSearchFilters({ search, showSearch })
    }, [search, showSearch])

    useEffect(() => {
        persistWishlist(wishlist)
    }, [wishlist])

    useEffect(() => {
        persistRecentlyViewed(personalizedHomeData.recentlyViewed || [])
    }, [personalizedHomeData.recentlyViewed])

    useEffect(() => {
        if (userInfo?.preferredCurrency) {
            setSelectedCurrency(userInfo.preferredCurrency)
        }
        if (userInfo?.preferredLanguage) {
            setSelectedLanguage(userInfo.preferredLanguage)
        }
        if (userInfo?.preferredRegion) {
            setSelectedRegion(userInfo.preferredRegion)
        }
    }, [userInfo?._id])

    const value = {
        products, currency, delivery_fee,
        search, setSearch, showSearch, setShowSearch,
        cartItems, addToCart, setCartItems,
        getCartCount, updateQuantity,
        getCartAmount, getProductPrice,
        navigate, backendUrl,
        setToken, token,
        userInfo, setUserInfo,
        wishlist, addToWishlist, removeFromWishlist, isInWishlist,
        createWishlistShareLink, fetchSharedWishlist,
        isAuthLoaded,
        autocompleteSuggestions, fetchAutocompleteSuggestions,
        popularSearchTerms, fetchPopularSearchTerms, trackSearchTerm,
        searchProductsAdvanced,
        personalizedHomeData, fetchPersonalizedHomeData,
        getRecommendations,
        trackProductView,
        askAiAssistant,
        getAiSupportStatus,
        getActiveSupportChat,
        getAbVariant,
        selectedCurrency,
        updateCurrency,
        selectedLanguage,
        updateLanguage,
        selectedRegion,
        updateRegion,
        convertPrice,
        clearPersistedCustomerState,
        t
    }

    return (
        <ShopContext.Provider value={value}>
            {props.children}
        </ShopContext.Provider>
    )
}

export default ShopContextProvider;