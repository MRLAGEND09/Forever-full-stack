import express from 'express'
import { saveAbandonedCart, clearAbandonedCart, getAbandonedCarts, sendAbandonedCartReminders } from '../controllers/abandonedCartController.js'
import authUser from '../middleware/auth.js'
import adminAuth from '../middleware/adminAuth.js'

const abandonedRouter = express.Router()

abandonedRouter.post('/save', authUser, saveAbandonedCart)
abandonedRouter.post('/clear', authUser, clearAbandonedCart)
abandonedRouter.get('/list', adminAuth, getAbandonedCarts)
abandonedRouter.post('/send-reminders', adminAuth, sendAbandonedCartReminders)

export default abandonedRouter