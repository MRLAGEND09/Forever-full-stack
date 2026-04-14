import express from 'express'
import authUser from '../middleware/auth.js'
import multer from 'multer'
import { aiChatSupport, generateVirtualTryOn } from '../controllers/aiController.js'

const aiRouter = express.Router()
const memoryUpload = multer({ storage: multer.memoryStorage() })

aiRouter.post('/chat', authUser, aiChatSupport)
aiRouter.post('/virtual-tryon', memoryUpload.fields([
	{ name: 'userImage', maxCount: 1 },
	{ name: 'garmentImage', maxCount: 1 }
]), generateVirtualTryOn)

export default aiRouter
