import express from 'express'
import {
    loginUser, registerUser, adminLogin, socialLogin,
    getUserProfile, updateProfile, changePassword,
    uploadAvatar, deleteAddress, deleteAccount
} from '../controllers/userController.js'
import authUser from '../middleware/auth.js'

const userRouter = express.Router()

userRouter.post('/register', registerUser)
userRouter.post('/login', loginUser)
userRouter.post('/admin', adminLogin)
userRouter.post('/social-login', socialLogin)
userRouter.post('/profile', authUser, getUserProfile)
userRouter.post('/update-profile', authUser, updateProfile)
userRouter.post('/change-password', authUser, changePassword)
userRouter.post('/upload-avatar', authUser, uploadAvatar)
userRouter.post('/delete-address', authUser, deleteAddress)
userRouter.post('/delete-account', authUser, deleteAccount)

export default userRouter