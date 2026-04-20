import orderModel from '../models/orderModel.js'
import productModel from '../models/productModel.js'
import userModel from '../models/userModel.js'
import {
    getUserState,
    setUserState,
    createComplaint,
    setUserProfile,
    getPendingComplaintByUser,
    getActiveComplaintByUser,
    getLatestComplaintByUser,
    getPendingAdminComplaints,
    resolveComplaint,
    markComplaintResolved,
    getLastReply,
    rememberReply,
    trackUserMessage
} from '../store/inMemorySupportStore.js'

const INVOICE_REGEX = /^\d{8}-\d{4}$/

const ORDER_TRACKING_TRIGGERS = ['track', 'order status', 'where is my order', 'my order', 'invoice']
const DELIVERY_TRIGGERS = ['delivery', 'shipping', 'courier', 'arrive']
const PRODUCT_TRIGGERS = ['product', 'size', 'material', 'fabric', 'stock', 'available']
const FASHION_TRIGGERS = ['outfit', 'style', 'look', 'wear', 'recommend', 'eid', 'casual', 'party']
const VAGUE_MESSAGES = new Set(['hi', 'hello', 'hey', 'i need help', 'need help', 'hello there', 'assistance'])
const FRUSTRATION_TRIGGERS = ['frustrat', 'angry', 'bad service', 'not happy', 'disappointed', 'worst', 'useless', 'annoyed']

const normalizeText = (value) => String(value || '').trim().toLowerCase()

const hasKeyword = (text, keywords = []) => keywords.some((word) => text.includes(word))

const isComplaintIntent = (text) => {
    const normalized = normalizeText(text)

    const keywords = [
        'complaint',
        'complain',
        'problem',
        'issue',
        'refund',
        'return'
    ]

    return keywords.some((word) => normalized.includes(word))
}

const isShortComplaintIntent = (text) => {
    const normalized = normalizeText(text)
    return [
        'complain',
        'complaint',
        'problem',
        'issue',
        'refund',
        'return'
    ].includes(normalized)
}

const chooseReply = (userId, options, fallback = '') => {
    const list = Array.isArray(options) ? options.filter(Boolean) : [options]
    const last = normalizeText(getLastReply(userId))
    const selected = list.find((item) => normalizeText(item) !== last) || list[0] || fallback
    rememberReply(userId, selected)
    return selected
}

const isVagueMessage = (text) => {
    const normalized = normalizeText(text)
    if (!normalized) return true
    return VAGUE_MESSAGES.has(normalized)
}

const isHelpMessage = (text) => ['i need help', 'need help', 'assistance'].includes(normalizeText(text))

const isGreetingMessage = (text) => ['hi', 'hello', 'hey', 'hello there'].includes(normalizeText(text))

const findBudget = (text) => {
    const match = String(text || '').match(/(?:bdt|tk|taka|\$|budget)?\s*(\d{2,6})/i)
    return match ? Number(match[1]) : null
}

const findOccasion = (text) => {
    const normalized = normalizeText(text)
    if (normalized.includes('eid')) return 'Eid'
    if (normalized.includes('party')) return 'Party'
    if (normalized.includes('casual')) return 'Casual'
    return 'General'
}

const findColor = (text) => {
    const colorSet = ['black', 'white', 'blue', 'red', 'green', 'pink', 'brown', 'beige', 'cream', 'gray', 'grey', 'navy']
    const normalized = normalizeText(text)
    return colorSet.find((item) => normalized.includes(item)) || ''
}

const pickOrderByMessage = async (userId, message) => {
    const invoiceMatch = String(message || '').match(/\d{8}-\d{4}/)
    if (invoiceMatch) {
        const byInvoice = await orderModel.findOne({ userId, invoiceNumber: invoiceMatch[0] }).lean()
        if (byInvoice) return byInvoice
    }

    return orderModel.findOne({ userId }).sort({ date: -1 }).lean()
}

const buildOrderReply = (order) => {
    if (!order) {
        return 'I couldn\'t find an order yet 😊 Share your invoice number and I\'ll check again.'
    }

    const ref = order.invoiceNumber || order.clientOrderId || order._id
    const paidStatus = order.payment ? 'Paid' : 'Pending'
    return `Order ${ref} is currently "${order.status}". Payment: ${paidStatus}.`
}

const buildDeliveryReply = async (userId, message) => {
    const order = await pickOrderByMessage(userId, message)
    if (!order) {
        return 'Delivery usually takes 2-4 business days inside Bangladesh 😊 Share your invoice number and I\'ll check the status.'
    }

    const ref = order.invoiceNumber || order.clientOrderId || order._id
    return `For order ${ref}, current status is "${order.status}". Delivery timing depends on this status and your location.`
}

const buildProductInfoReply = async (message) => {
    const terms = normalizeText(message)
        .split(/\s+/)
        .filter((part) => part.length > 2)
        .slice(0, 6)

    if (!terms.length) {
        return 'Tell me the product name or category 👍 I\'ll check the details for you.'
    }

    const regex = new RegExp(terms.join('|'), 'i')
    const products = await productModel.find({
        $or: [
            { name: regex },
            { category: regex },
            { subCategory: regex },
            { brand: regex }
        ]
    }).limit(3).lean()

    if (!products.length) {
        return 'I couldn\'t match that yet. Share the exact product name and I\'ll check it for you 👍'
    }

    const summary = products
        .map((item) => `${item.name} (${item.category}) - BDT ${item.price}, stock ${item.stock}`)
        .join(' | ')

    return `Here\'s what I found 😊 ${summary}`
}

const buildFashionCatalog = async (message) => {
    const budget = findBudget(message)
    const occasion = findOccasion(message)
    const color = findColor(message)

    const query = {}
    if (budget) {
        query.price = { $lte: budget }
    }

    if (color) {
        query.$or = [
            { colors: { $in: [color] } },
            { name: new RegExp(color, 'i') },
            { description: new RegExp(color, 'i') }
        ]
    }

    const products = await productModel.find(query).sort({ bestseller: -1, rating: -1, date: -1 }).limit(8).lean()

    return {
        budget,
        occasion,
        color,
        products
    }
}

const pickProductByType = (products, keywords = []) => {
    const lowerKeywords = keywords.map((item) => String(item).toLowerCase())
    return products.find((item) => {
        const pool = [item.name, item.category, item.subCategory].join(' ').toLowerCase()
        return lowerKeywords.some((word) => pool.includes(word))
    })
}

const buildSpecificFashionReply = (fashionContext) => {
    const products = fashionContext?.products || []
    if (!products.length) {
        return ''
    }

    const top = pickProductByType(products, ['shirt', 't-shirt', 'top', 'blouse', 'hoodie', 'jacket']) || products[0]
    const bottom = pickProductByType(products, ['pant', 'jean', 'trouser', 'skirt']) || products[1] || products[0]
    const accessory = pickProductByType(products, ['bag', 'belt', 'cap', 'watch', 'sneaker', 'shoe'])

    const budgetPart = fashionContext?.budget ? `under ${fashionContext.budget} BDT` : 'within your budget'
    const occasionPart = fashionContext?.occasion && fashionContext.occasion !== 'General'
        ? `for ${fashionContext.occasion}`
        : 'for your vibe'
    const colorPart = fashionContext?.color ? ` in ${fashionContext.color}` : ''
    const accessoryText = accessory ? accessory.name : 'clean white sneakers and a minimal watch'

    return `For a ${occasionPart} look ${budgetPart}, try ${top.name}${colorPart} with ${bottom.name} and ${accessoryText} 👌\nWant me to make it softer or more bold?`
}

const callOpenRouter = async ({ message, userId, fashionContext }) => {
    const apiKey = process.env.OPENROUTER_API_KEY
    if (!apiKey) {
        return ''
    }

    const model = process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini'
    const productLines = (fashionContext?.products || [])
        .map((item) => `- ${item.name} | ${item.category}/${item.subCategory} | BDT ${item.price} | colors: ${(item.colors || []).join(', ') || 'n/a'}`)
        .join('\n')

    const systemPrompt = [
        'You are BLOOP AI, a hybrid fashion stylist and customer support assistant for an ecommerce brand.',
        'Style: friendly, modern, stylish, concise, and human-like.',
        'Never repeat the same sentence from previous replies.',
        'Adapt directly to the user message and keep responses short but personalized.',
        'Keep every reply within 2-4 short lines.',
        'If message is vague, ask a guiding follow-up question.',
        'If user sounds frustrated, start with empathy and then offer action.',
        'Do not explain system logic or mention escalation/admin unless the user complaint flow requires it.',
        'Never invent order data or policy promises.',
        'If uncertain, say you will connect support.',
        'For styling requests, recommend a full outfit (top + bottom + accessories) and keep it realistic to supplied products.'
    ].join(' ')

    const userPrompt = [
        `User ID: ${userId}`,
        `Message: ${message}`,
        `Budget: ${fashionContext?.budget || 'not specified'}`,
        `Occasion: ${fashionContext?.occasion || 'not specified'}`,
        `Color preference: ${fashionContext?.color || 'not specified'}`,
        'Catalog candidates:',
        productLines || '- No direct catalog matches found.'
    ].join('\n')

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': process.env.OPENROUTER_HTTP_REFERER || 'https://bloop-fashion.local',
            'X-Title': process.env.OPENROUTER_APP_NAME || 'BLOOP Fashion Assistant'
        },
        body: JSON.stringify({
            model,
            temperature: 0.5,
            max_tokens: 260,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ]
        })
    })

    if (!response.ok) {
        return ''
    }

    const data = await response.json()
    return String(data?.choices?.[0]?.message?.content || '').trim()
}

const getSupportUserProfile = async (userId) => {
    if (!userId) return { name: 'Customer', image: '' }

    const user = await userModel.findById(userId).select('name avatar').lean()
    const profile = {
        name: String(user?.name || 'Customer').trim(),
        image: String(user?.avatar || '').trim()
    }
    setUserProfile(userId, profile)
    return profile
}

const hybridChatSupport = async (req, res) => {
    try {
        const userId = req.body.userId
        const message = String(req.body.message || '').trim()

        if (!userId) {
            return res.json({ success: false, message: 'User not authorized' })
        }

        if (!message) {
            const reply = chooseReply(userId, [
                'Hey 😊 What can I help you with today?',
                'Hi 😊 What do you need help with today?'
            ], 'How can I help today?')
            return res.json({ success: true, reply, status: 'done' })
        }

        const pendingComplaint = getPendingComplaintByUser(userId)
        if (pendingComplaint) {
            const reply = chooseReply(userId, [
                '⏳ Please wait for admin response before sending new messages.',
                '⏳ Our support admin is reviewing your complaint now. Please wait for the reply.'
            ], '⏳ Please wait for admin response before sending new messages.')
            return res.json({
                success: true,
                reply,
                status: 'pending_admin'
            })
        }

        const state = getUserState(userId)
        const normalized = normalizeText(message)
        const vague = isVagueMessage(normalized)
        const { unclearCount } = trackUserMessage(userId, normalized, { isUnclear: vague })

        if (isGreetingMessage(normalized)) {
            const reply = chooseReply(userId, [
                'Hey 😊 What can I help you with today?',
                'Hello 😊 What can I do for you today?'
            ], 'Hey 😊 What can I help you with today?')
            return res.json({ success: true, reply, status: 'done' })
        }

        if (isHelpMessage(normalized)) {
            const reply = chooseReply(userId, [
                'Sure 👍 What do you need help with?\n• Outfit ideas\n• Order tracking\n• Something else?',
                'Of course 😊 What do you need right now?\n• Styling help\n• Order update\n• Something else?'
            ], 'Sure 👍 What do you need help with?')
            return res.json({ success: true, reply, status: 'done' })
        }

        if (isComplaintIntent(normalized) || isShortComplaintIntent(normalized)) {
            setUserState(userId, { step: 'ask_invoice' })
            const reply = chooseReply(userId, [
                'I\'m sorry you\'re facing an issue 😔\nPlease enter your invoice number 📄',
                'Sorry about this 😔\nPlease share your invoice number so I can open your complaint 📄'
            ], 'I\'m sorry you\'re facing an issue 😔\nPlease enter your invoice number 📄')
            return res.json({
                success: true,
                reply,
                status: 'ask_invoice'
            })
        }

        if (state && state.step === 'ask_invoice') {
            if (!INVOICE_REGEX.test(message)) {
                const reply = chooseReply(userId, [
                    'Invalid invoice format ❌\nExample: 20260414-0797',
                    'That invoice format looks off ❌\nTry like this: 20260414-0797'
                ], 'Invalid invoice format ❌\nExample: 20260414-0797')
                return res.json({
                    success: true,
                    reply,
                    status: 'ask_invoice'
                })
            }

            setUserState(userId, { step: 'ask_problem', invoice: message })
            const reply = chooseReply(userId, [
                'Invoice verified ✅\nPlease describe your issue.',
                'Great, invoice confirmed ✅\nTell me what went wrong and I\'ll pass it to support.'
            ], 'Invoice verified ✅\nPlease describe your issue.')
            return res.json({
                success: true,
                reply,
                status: 'ask_problem'
            })
        }

        if (state && state.step === 'ask_problem') {
            const profile = await getSupportUserProfile(userId)
            const complaint = createComplaint({
                id: Date.now(),
                userId,
                userName: profile.name,
                userImage: profile.image,
                invoice: state.invoice,
                problem: message
            })

            setUserState(userId, { step: 'done', invoice: '' })

            const reply = chooseReply(userId, [
                'Your complaint has been forwarded to our support team.\nAdmin will assist you shortly.',
                'Thanks for sharing this. I\'ve forwarded your complaint to support, and an admin will reply soon.'
            ], 'Your complaint has been forwarded to our support team.\nAdmin will assist you shortly.')

            return res.json({
                success: true,
                reply,
                status: complaint.status,
                complaintId: complaint.id
            })
        }

        if (hasKeyword(normalized, FRUSTRATION_TRIGGERS)) {
            const reply = chooseReply(userId, [
                'Sorry about that 😔 Let me help you sort this out.\nIs it about an order or a product issue?',
                'I get why that\'s frustrating 😔\nTell me if this is about an order or styling, and I\'ll help fast.'
            ], 'Sorry about that 😔 Let me help you fix this quickly.')
            return res.json({ success: true, reply, status: 'done' })
        }

        if (hasKeyword(normalized, ORDER_TRACKING_TRIGGERS)) {
            const order = await pickOrderByMessage(userId, message)
            const orderReply = buildOrderReply(order)
            const reply = chooseReply(userId, [orderReply], orderReply)
            return res.json({
                success: true,
                reply,
                status: 'done'
            })
        }

        if (hasKeyword(normalized, DELIVERY_TRIGGERS)) {
            const deliveryReply = await buildDeliveryReply(userId, message)
            const reply = chooseReply(userId, [deliveryReply], deliveryReply)
            return res.json({ success: true, reply, status: 'done' })
        }

        if (hasKeyword(normalized, PRODUCT_TRIGGERS)) {
            const productReply = await buildProductInfoReply(message)
            const reply = chooseReply(userId, [productReply], productReply)
            return res.json({ success: true, reply, status: 'done' })
        }

        if (vague || unclearCount >= 2) {
            const reply = chooseReply(userId, [
                'Got you 👍 Could you tell me a bit more?\nIs it about an order or styling?',
                'I\'m with you 😊\nDo you need help with an order, product info, or outfit ideas?',
                'Tell me a little more 👍\nIs this about fashion or support?'
            ], 'Could you tell me what kind of help you need?')
            return res.json({ success: true, reply, status: 'done' })
        }

        const fashionContext = hasKeyword(normalized, FASHION_TRIGGERS)
            ? await buildFashionCatalog(message)
            : { budget: null, occasion: '', color: '', products: [] }

        const aiReply = await callOpenRouter({
            message,
            userId,
            fashionContext
        })

        if (aiReply) {
            const reply = chooseReply(userId, [aiReply], aiReply)
            return res.json({ success: true, reply, status: 'done' })
        }

        const fashionFallback = buildSpecificFashionReply(fashionContext)
        const fallbackOptions = fashionFallback
            ? [fashionFallback]
            : [
                'I can help with styling or support 😊\nTell me your budget, occasion, or order question.',
                'I\'m sorry you\'re facing an issue 😔\nPlease enter your invoice number 📄'
            ]

        const reply = chooseReply(userId, fallbackOptions, 'I can help with styling and support. Tell me how you want to continue.')
        return res.json({ success: true, reply, status: 'done' })
    } catch (error) {
        console.log(error)
        return res.json({ success: false, message: error.message })
    }
}

const getUserSupportStatus = async (req, res) => {
    try {
        const userId = req.body.userId || req.userId
        const activeComplaint = getActiveComplaintByUser(userId)
        const state = getUserState(userId)

        if (!activeComplaint) {
            return res.json({ success: true, status: state.step || 'done', complaint: null })
        }

        return res.json({
            success: true,
            status: activeComplaint.status,
            complaint: activeComplaint
        })
    } catch (error) {
        console.log(error)
        return res.json({ success: false, message: error.message })
    }
}

const getUserActiveChat = async (req, res) => {
    try {
        const userId = req.body.userId || req.userId
        const activeComplaint = getActiveComplaintByUser(userId)

        if (!activeComplaint) {
            return res.json({ success: true, status: 'done', ticket: null, messages: [] })
        }

        return res.json({
            success: true,
            status: activeComplaint.status,
            ticket: activeComplaint,
            messages: activeComplaint.messages || []
        })
    } catch (error) {
        console.log(error)
        return res.json({ success: false, message: error.message })
    }
}

const getPendingAdminChats = async (req, res) => {
    try {
        const chats = getPendingAdminComplaints()
        return res.json({ success: true, chats })
    } catch (error) {
        console.log(error)
        return res.json({ success: false, message: error.message })
    }
}

const replyAdminChat = async (req, res) => {
    try {
        const { id, userId, reply } = req.body

        if (!id || !String(reply || '').trim()) {
            return res.json({ success: false, message: 'Complaint id and reply are required' })
        }

        const resolved = resolveComplaint({ id, userId, reply: String(reply).trim() })
        if (!resolved) {
            return res.json({ success: false, message: 'Complaint not found' })
        }

        return res.json({ success: true, complaint: resolved })
    } catch (error) {
        console.log(error)
        return res.json({ success: false, message: error.message })
    }
}

const resolveAdminChat = async (req, res) => {
    try {
        const { id, userId } = req.body

        if (!id) {
            return res.json({ success: false, message: 'Complaint id is required' })
        }

        const complaint = markComplaintResolved({ id, userId })
        if (!complaint) {
            return res.json({ success: false, message: 'Complaint not found' })
        }

        return res.json({ success: true, complaint })
    } catch (error) {
        console.log(error)
        return res.json({ success: false, message: error.message })
    }
}

export {
    hybridChatSupport,
    getUserSupportStatus,
    getUserActiveChat,
    getPendingAdminChats,
    replyAdminChat,
    resolveAdminChat
}
