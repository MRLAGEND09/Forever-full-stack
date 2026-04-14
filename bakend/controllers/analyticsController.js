import orderModel from '../models/orderModel.js'
import userModel from '../models/userModel.js'
import productModel from '../models/productModel.js'
import abandonedCartModel from '../models/abandonedCartModel.js'
import searchAnalyticsModel from '../models/searchAnalyticsModel.js'
import abTestEventModel from '../models/abTestEventModel.js'

const deterministicVariant = (seed = '') => {
    let hash = 0
    const str = String(seed || 'guest')
    for (let i = 0; i < str.length; i += 1) {
        hash = ((hash << 5) - hash) + str.charCodeAt(i)
        hash |= 0
    }
    return Math.abs(hash) % 2 === 0 ? 'A' : 'B'
}

const getRealtimeDashboard = async (req, res) => {
    try {
        const [orders, usersCount, abandonedCount, popularTerms] = await Promise.all([
            orderModel.find({}).lean(),
            userModel.countDocuments(),
            abandonedCartModel.countDocuments({ status: 'abandoned' }),
            searchAnalyticsModel.find({}).sort({ count: -1 }).limit(5).lean()
        ])

        const totalOrders = orders.length
        const paidOrders = orders.filter((o) => o.payment).length
        const deliveredOrders = orders.filter((o) => o.status === 'Delivered').length
        const revenue = orders.reduce((sum, o) => sum + (Number(o.amount) || 0), 0)
        const conversionRate = usersCount > 0 ? Number(((totalOrders / usersCount) * 100).toFixed(2)) : 0

        res.json({
            success: true,
            stats: {
                totalOrders,
                paidOrders,
                deliveredOrders,
                revenue,
                usersCount,
                abandonedCount,
                conversionRate,
                topSearches: popularTerms
            }
        })
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

const getCustomerSegments = async (req, res) => {
    try {
        const orders = await orderModel.find({}).lean()
        const map = new Map()

        orders.forEach((order) => {
            const id = String(order.userId)
            const prev = map.get(id) || { userId: id, totalSpent: 0, orderCount: 0 }
            prev.totalSpent += Number(order.amount) || 0
            prev.orderCount += 1
            map.set(id, prev)
        })

        const all = [...map.values()]
        const vip = all.filter((u) => u.totalSpent >= 15000 || u.orderCount >= 8)
        const frequent = all.filter((u) => u.orderCount >= 4 && u.orderCount < 8)
        const newBuyers = all.filter((u) => u.orderCount <= 1)

        res.json({ success: true, segments: { vip, frequent, newBuyers } })
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

const getInventoryAlerts = async (req, res) => {
    try {
        const products = await productModel.find({}).select('name stock reorderThreshold reorderQuantity').lean()
        const lowStock = products.filter((p) => Number(p.stock) <= Number(p.reorderThreshold || 5))
        res.json({ success: true, lowStock })
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

const autoReorder = async (req, res) => {
    try {
        const products = await productModel.find({}).lean()
        const lowStock = products.filter((p) => Number(p.stock) <= Number(p.reorderThreshold || 5))

        for (const product of lowStock) {
            await productModel.updateOne(
                { _id: product._id },
                { $inc: { stock: Number(product.reorderQuantity || 20) } }
            )
        }

        res.json({ success: true, reordered: lowStock.length })
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

const getAbTestVariant = async (req, res) => {
    try {
        const { testKey = 'default-home', userId = '', sessionId = '' } = req.body
        const variant = deterministicVariant(`${testKey}:${userId || sessionId || 'guest'}`)
        await abTestEventModel.create({ testKey, variant, userId: String(userId || ''), event: 'assignment' })
        res.json({ success: true, testKey, variant })
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

const trackAbTestEvent = async (req, res) => {
    try {
        const { testKey = 'default-home', variant = 'A', userId = '', event = 'impression', metadata = {} } = req.body
        await abTestEventModel.create({ testKey, variant, userId: String(userId || ''), event, metadata })
        res.json({ success: true })
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

export {
    getRealtimeDashboard,
    getCustomerSegments,
    getInventoryAlerts,
    autoReorder,
    getAbTestVariant,
    trackAbTestEvent
}
