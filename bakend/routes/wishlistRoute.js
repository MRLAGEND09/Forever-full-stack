import express from 'express'
import { addToWishlist, removeFromWishlist, getUserWishlist, checkWishlist, createWishlistShareLink, getSharedWishlist } from '../controllers/wishlistController.js'
import authUser from '../middleware/auth.js'

const wishlistRouter = express.Router()

wishlistRouter.post('/add', authUser, addToWishlist)
wishlistRouter.post('/remove', authUser, removeFromWishlist)
wishlistRouter.post('/get', authUser, getUserWishlist)
wishlistRouter.post('/check', authUser, checkWishlist)
wishlistRouter.post('/share', authUser, createWishlistShareLink)
wishlistRouter.post('/shared', getSharedWishlist)

export default wishlistRouter