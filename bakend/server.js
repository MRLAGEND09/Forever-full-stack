import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import connectDB from './config/mongodb.js'
import connectCloudinary from './config/cloudinary.js'
import userRouter from './routes/userRoute.js'
import productRouter from './routes/productRoute.js'
import cartRouter from './routes/cartRoute.js'
import orderRouter from './routes/orderRoute.js'
import subscriberRouter from './routes/subscriberRoute.js'
import abandonedRouter from './routes/abandonedCartRoute.js'
import reviewRouter from './routes/reviewRoute.js'
import wishlistRouter from './routes/wishlistRoute.js'
import aiRouter from './routes/aiRoute.js'
import analyticsRouter from './routes/analyticsRoute.js'
import adminSupportRouter from './routes/adminSupportRoute.js'
import uploadRouter from './routes/uploadRoute.js'
import path from 'path'

// App config 
const app = express()
const port = process.env.PORT || 4000
connectDB()
connectCloudinary()


// middlewares
app.use(express.json())
app.use(cors())
app.use('/uploads', express.static(path.resolve('uploads')))


// api endpoints  
app.use('/api/user',userRouter)
app.use('/api/product',productRouter)
app.use('/api/cart',cartRouter)
app.use('/api/order',orderRouter)
app.use('/api/abandoned', abandonedRouter)
app.use('/api/review', reviewRouter)
app.use('/api/wishlist', wishlistRouter)
app.use('/api/ai', aiRouter)
app.use('/api/analytics', analyticsRouter)
app.use('/api/admin', adminSupportRouter)
app.use('/api', uploadRouter)






// Subscriber API
app.use('/api/subscriber', subscriberRouter)


app.get('/',(req,res)=>{
    res.send("API Working")
})

app.listen(port, ()=> console.log('Server Stared on PORT : '+ port))