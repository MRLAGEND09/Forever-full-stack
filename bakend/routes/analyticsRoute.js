import express from 'express'
import adminAuth from '../middleware/adminAuth.js'
import {
    getRealtimeDashboard,
    getCustomerSegments,
    getInventoryAlerts,
    autoReorder,
    getAbTestVariant,
    trackAbTestEvent
} from '../controllers/analyticsController.js'

const analyticsRouter = express.Router()

analyticsRouter.get('/dashboard', adminAuth, getRealtimeDashboard)
analyticsRouter.get('/segments', adminAuth, getCustomerSegments)
analyticsRouter.get('/inventory-alerts', adminAuth, getInventoryAlerts)
analyticsRouter.post('/inventory-auto-reorder', adminAuth, autoReorder)
analyticsRouter.post('/ab/variant', getAbTestVariant)
analyticsRouter.post('/ab/event', trackAbTestEvent)

export default analyticsRouter
