import validator from "validator";
import bcrypt from "bcrypt"
import jwt from 'jsonwebtoken'
import userModel from "../models/userModel.js";
import { v2 as cloudinary } from 'cloudinary'

const createToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET)
}

const tempEmailDomains = [
    'mailinator.com', 'guerrillamail.com', 'tempmail.com', 'throwaway.email',
    'yopmail.com', 'sharklasers.com', 'guerrillamailblock.com', 'grr.la',
    'guerrillamail.info', 'guerrillamail.biz', 'guerrillamail.de', 'guerrillamail.net',
    'guerrillamail.org', 'spam4.me', 'trashmail.com', 'trashmail.me', 'trashmail.net',
    'dispostable.com', 'mailnull.com', 'spamgourmet.com', 'trashmail.at',
    'tempr.email', 'discard.email', 'spambox.us', 'maildrop.cc',
    'mintemail.com', 'spamfree24.org', 'mailnew.com', 'tempinbox.com',
    'throwam.com', 'fakeinbox.com', 'mailscrap.com', 'spamherelots.com',
    'getairmail.com', 'filzmail.com', 'mailexpire.com', 'spamex.com',
    'tempmail.net', 'emailondeck.com', '10minutemail.com', '10minutemail.net',
    'temp-mail.org', 'mohmal.com', 'mailtemp.net', 'getnada.com',
    'tempail.com', 'spamgourmet.net'
]

const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await userModel.findOne({ email });
        if (!user) {
            return res.json({ success: false, message: "User doesn't exists" })
        }
        if (user.provider && user.provider !== 'manual') {
            return res.json({ success: false, message: `Please login with ${user.provider}` })
        }
        const isMatch = await bcrypt.compare(password, user.password)
        if (isMatch) {
            const token = createToken(user._id)
            res.json({ success: true, token })
        } else {
            res.json({ success: false, message: "Invalid credentials" })
        }
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message })
    }
}

const registerUser = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const exists = await userModel.findOne({ email })
        if (exists) {
            return res.json({ success: false, message: "User already exists" })
        }
        if (!validator.isEmail(email)) {
            return res.json({ success: false, message: "Please enter a valid email" })
        }
        const emailDomain = email.split('@')[1].toLowerCase()
        if (tempEmailDomains.includes(emailDomain)) {
            return res.json({ success: false, message: "Temporary or disposable emails are not allowed." })
        }
        if (password.length < 8) {
            return res.json({ success: false, message: "Please enter a strong password (min 8 characters)" })
        }
        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(password, salt)
        const newUser = new userModel({
            name,
            email,
            password: hashedPassword,
            provider: 'manual'
        })
        const user = await newUser.save()
        const token = createToken(user._id)
        res.json({ success: true, token })
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message })
    }
}

const adminLogin = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
            const token = jwt.sign(email + password, process.env.JWT_SECRET);
            res.json({ success: true, token })
        } else {
            res.json({ success: false, message: "Invalid credentials" })
        }
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message })
    }
}

const socialLogin = async (req, res) => {
    try {
        const { name, email, avatar, uid, provider } = req.body;
        let user = await userModel.findOne({ email })
        if (!user) {
            user = new userModel({ name, email, password: uid, avatar, provider })
            await user.save()
        } else {
            await userModel.findByIdAndUpdate(user._id, { avatar, provider })
        }
        const token = createToken(user._id)
        res.json({ success: true, token })
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message })
    }
}

const getUserProfile = async (req, res) => {
    try {
        const { userId } = req.body
        const user = await userModel.findById(userId).select('-password')
        if (!user) {
            return res.json({ success: false, message: 'User not found' })
        }
        res.json({ success: true, user })
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

const updateProfile = async (req, res) => {
    try {
        const { userId, name, address } = req.body
        await userModel.findByIdAndUpdate(userId, { name, address })
        res.json({ success: true, message: 'Profile updated' })
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

const changePassword = async (req, res) => {
    try {
        const { userId, currentPassword, newPassword } = req.body
        const user = await userModel.findById(userId)
        if (!user) return res.json({ success: false, message: 'User not found' })
        const isMatch = await bcrypt.compare(currentPassword, user.password)
        if (!isMatch) return res.json({ success: false, message: 'Current password is incorrect' })
        const salt = await bcrypt.genSalt(10)
        const hashed = await bcrypt.hash(newPassword, salt)
        await userModel.findByIdAndUpdate(userId, { password: hashed })
        res.json({ success: true, message: 'Password changed' })
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

const uploadAvatar = async (req, res) => {
    try {
        const { userId, avatarBase64 } = req.body
        if (!avatarBase64) {
            return res.json({ success: false, message: 'No image provided' })
        }
        const result = await cloudinary.uploader.upload(avatarBase64, {
            resource_type: 'image',
            folder: 'forever/avatars'
        })
        await userModel.findByIdAndUpdate(userId, { avatar: result.secure_url })
        res.json({ success: true, avatar: result.secure_url })
    } catch (error) {
        console.log('Avatar upload error:', error)
        res.json({ success: false, message: error.message })
    }
}

const deleteAddress = async (req, res) => {
    try {
        const { userId } = req.body
        await userModel.findByIdAndUpdate(userId, {
            address: { street: '', city: '', state: '', zipcode: '', country: '', phone: '' }
        })
        res.json({ success: true, message: 'Address deleted' })
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

const deleteAccount = async (req, res) => {
    try {
        const { userId, password } = req.body
        const user = await userModel.findById(userId)
        if (!user) return res.json({ success: false, message: 'User not found' })
        if (user.provider === 'manual') {
            if (!password) return res.json({ success: false, message: 'Password required' })
            const isMatch = await bcrypt.compare(password, user.password)
            if (!isMatch) return res.json({ success: false, message: 'Incorrect password' })
        }
        await userModel.findByIdAndDelete(userId)
        res.json({ success: true, message: 'Account deleted' })
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

export {
    loginUser, registerUser, adminLogin, socialLogin,
    getUserProfile, updateProfile, changePassword,
    uploadAvatar, deleteAddress, deleteAccount
}