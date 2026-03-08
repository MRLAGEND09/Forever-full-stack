import express from 'express'
import { subscribeUser, validateCoupon, useCoupon } from '../controllers/subscriberController.js'

const subscriberRouter = express.Router()

subscriberRouter.post('/subscribe', subscribeUser)
subscriberRouter.post('/validate', validateCoupon)
subscriberRouter.post('/use', useCoupon)

export default subscriberRouter