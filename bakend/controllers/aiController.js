import orderModel from '../models/orderModel.js'
import productModel from '../models/productModel.js'
import { v2 as cloudinary } from 'cloudinary'

const normalizeText = (value) => String(value || '').trim().toLowerCase()

const getErrorMessage = (error) => {
    if (!error) return 'Unknown error'
    if (typeof error === 'string') return error
    return error.message || 'Unknown error'
}

const fileToBuffer = async (file) => {
    if (!file) return null
    if (file.buffer) return file.buffer
    if (file.path) {
        const fs = await import('fs/promises')
        return fs.readFile(file.path)
    }
    return null
}

const bufferToDataUri = (buffer, mimeType = 'image/png') => {
    const base64 = Buffer.from(buffer).toString('base64')
    return `data:${mimeType};base64,${base64}`
}

const parseDataUrlToBuffer = (dataUrl) => {
    const match = String(dataUrl || '').match(/^data:(.+);base64,(.+)$/)
    if (!match) return null
    return {
        mimeType: match[1] || 'image/png',
        buffer: Buffer.from(match[2], 'base64')
    }
}

const fetchImageFromUrl = async (url) => {
    if (!url) return null
    const response = await fetch(url)
    if (!response.ok) throw new Error(`Could not fetch garment image from URL (${response.status})`)
    const arr = await response.arrayBuffer()
    return {
        buffer: Buffer.from(arr),
        mimeType: response.headers.get('content-type') || 'image/png'
    }
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const uploadBufferToCloudinary = async (buffer, mimeType, folder = 'virtual_tryon') => {
    const uploaded = await cloudinary.uploader.upload(bufferToDataUri(buffer, mimeType || 'image/png'), {
        folder,
        resource_type: 'image'
    })

    return uploaded.secure_url
}

const safeJsonParse = (value, fallback = {}) => {
    if (!value) return fallback
    try {
        const parsed = JSON.parse(value)
        return parsed && typeof parsed === 'object' ? parsed : fallback
    } catch (error) {
        return fallback
    }
}

const extractReplicateOutputUrl = (output) => {
    if (!output) return ''
    if (typeof output === 'string') return output

    if (Array.isArray(output)) {
        const firstUrl = output.find((item) => typeof item === 'string' && /^https?:\/\//i.test(item))
        return firstUrl || ''
    }

    if (typeof output === 'object') {
        const candidateKeys = ['image', 'url', 'output', 'result']
        for (const key of candidateKeys) {
            const value = output[key]
            const resolved = extractReplicateOutputUrl(value)
            if (resolved) return resolved
        }
    }

    return ''
}

const tryReplicateVirtualTryOn = async ({ userBuffer, userMimeType, garmentBuffer, garmentMimeType, prompt = '', garmentDescription = '', garmentCategory = '' }) => {
    const token = process.env.REPLICATE_API_TOKEN
    const version = process.env.REPLICATE_VIRTUAL_TRYON_VERSION

    if (!token || !version || !userBuffer || !garmentBuffer) {
        return { success: false, reason: 'Replicate token/version/inputs not configured' }
    }

    const userImageUrl = await uploadBufferToCloudinary(userBuffer, userMimeType, 'virtual_tryon/inputs')
    const garmentImageUrl = await uploadBufferToCloudinary(garmentBuffer, garmentMimeType, 'virtual_tryon/inputs')

    const userImageKey = process.env.REPLICATE_VIRTUAL_TRYON_USER_KEY || 'human_img'
    const garmentImageKey = process.env.REPLICATE_VIRTUAL_TRYON_GARMENT_KEY || 'garm_img'
    const promptKey = process.env.REPLICATE_VIRTUAL_TRYON_PROMPT_KEY || ''
    const descriptionKey = process.env.REPLICATE_VIRTUAL_TRYON_DESCRIPTION_KEY || ''
    const categoryKey = process.env.REPLICATE_VIRTUAL_TRYON_CATEGORY_KEY || ''
    const extraInput = safeJsonParse(process.env.REPLICATE_VIRTUAL_TRYON_EXTRA_INPUT, {})

    const input = {
        ...extraInput,
        [userImageKey]: userImageUrl,
        [garmentImageKey]: garmentImageUrl
    }

    if (prompt && promptKey) {
        input[promptKey] = prompt
    }

    if (garmentDescription && descriptionKey) {
        input[descriptionKey] = garmentDescription
    }

    if (garmentCategory && categoryKey) {
        input[categoryKey] = garmentCategory
    }

    const createResponse = await fetch('https://api.replicate.com/v1/predictions', {
        method: 'POST',
        headers: {
            Authorization: `Token ${token}`,
            'Content-Type': 'application/json',
            Prefer: 'wait'
        },
        body: JSON.stringify({ version, input })
    })

    if (!createResponse.ok) {
        const errorText = await createResponse.text()
        throw new Error(`Replicate prediction create failed: ${errorText || createResponse.status}`)
    }

    let prediction = await createResponse.json()

    if (prediction.status !== 'succeeded') {
        const maxAttempts = Number(process.env.REPLICATE_POLL_ATTEMPTS || 25)
        const pollDelay = Number(process.env.REPLICATE_POLL_INTERVAL_MS || 2500)

        for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
            if (['succeeded', 'failed', 'canceled'].includes(prediction.status)) break

            await sleep(pollDelay)

            const pollResponse = await fetch(`https://api.replicate.com/v1/predictions/${prediction.id}`, {
                headers: {
                    Authorization: `Token ${token}`,
                    'Content-Type': 'application/json'
                }
            })

            if (!pollResponse.ok) {
                const errorText = await pollResponse.text()
                throw new Error(`Replicate prediction poll failed: ${errorText || pollResponse.status}`)
            }

            prediction = await pollResponse.json()
        }
    }

    if (prediction.status !== 'succeeded') {
        throw new Error(prediction.error || `Replicate prediction ended with status: ${prediction.status}`)
    }

    const outputUrl = extractReplicateOutputUrl(prediction.output)
    if (!outputUrl) {
        return { success: false, reason: 'Replicate output did not include a usable image URL' }
    }

    const fetched = await fetchImageFromUrl(outputUrl)
    if (!fetched?.buffer) {
        return { success: false, reason: 'Could not fetch Replicate output image' }
    }

    return {
        success: true,
        provider: 'replicate',
        buffer: fetched.buffer,
        mimeType: fetched.mimeType || 'image/png',
        outputUrl
    }
}

const removeBackgroundIfConfigured = async (imageBuffer, mimeType) => {
    const apiKey = process.env.REMOVE_BG_API_KEY
    if (!apiKey) {
        return {
            removed: false,
            buffer: imageBuffer,
            mimeType,
            provider: 'none'
        }
    }

    const formData = new FormData()
    formData.append('size', 'auto')
    formData.append('format', 'png')
    formData.append('image_file', new Blob([imageBuffer], { type: mimeType || 'image/png' }), 'user-image.png')

    const response = await fetch('https://api.remove.bg/v1.0/removebg', {
        method: 'POST',
        headers: {
            'X-Api-Key': apiKey
        },
        body: formData
    })

    if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`remove.bg failed: ${errorText || response.status}`)
    }

    const arr = await response.arrayBuffer()
    return {
        removed: true,
        buffer: Buffer.from(arr),
        mimeType: 'image/png',
        provider: 'remove.bg'
    }
}

const tryHuggingFaceVirtualTryOn = async ({ userBuffer, userMimeType, garmentBuffer, garmentMimeType, prompt = '' }) => {
    const endpoint = process.env.HF_TRYON_ENDPOINT
    const token = process.env.HUGGINGFACE_API_KEY || process.env.HF_API_KEY

    if (!endpoint || !token || !userBuffer || !garmentBuffer) {
        return { success: false, reason: 'HF endpoint/token/inputs not configured' }
    }

    const payload = {
        inputs: {
            user_image: bufferToDataUri(userBuffer, userMimeType || 'image/png'),
            garment_image: bufferToDataUri(garmentBuffer, garmentMimeType || 'image/png'),
            prompt: prompt || 'Generate realistic virtual try-on for ecommerce product preview'
        }
    }

    const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    })

    if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`HuggingFace try-on failed: ${errorText || response.status}`)
    }

    const contentType = response.headers.get('content-type') || ''

    if (contentType.includes('image/')) {
        const arr = await response.arrayBuffer()
        return {
            success: true,
            provider: 'huggingface',
            buffer: Buffer.from(arr),
            mimeType: contentType
        }
    }

    const json = await response.json()
    const base64Field = json?.image || json?.output?.image || json?.data?.[0]
    const parsed = parseDataUrlToBuffer(base64Field)

    if (parsed?.buffer) {
        return {
            success: true,
            provider: 'huggingface',
            buffer: parsed.buffer,
            mimeType: parsed.mimeType || 'image/png'
        }
    }

    return { success: false, reason: 'HF response did not include a usable image' }
}

const cloudinaryOverlayFallback = async ({ userBuffer, userMimeType, garmentBuffer, garmentMimeType }) => {
    if (!userBuffer || !garmentBuffer) {
        return { success: false, reason: 'Missing user/garment buffers for overlay fallback' }
    }

    const userUpload = await cloudinary.uploader.upload(bufferToDataUri(userBuffer, userMimeType || 'image/png'), {
        folder: 'virtual_tryon',
        resource_type: 'image'
    })

    const garmentUpload = await cloudinary.uploader.upload(bufferToDataUri(garmentBuffer, garmentMimeType || 'image/png'), {
        folder: 'virtual_tryon',
        resource_type: 'image'
    })

    const composedUrl = cloudinary.url(userUpload.public_id, {
        secure: true,
        transformation: [
            {
                overlay: garmentUpload.public_id,
                gravity: 'center',
                width: 0.56,
                crop: 'scale',
                y: -20,
                opacity: 85
            }
        ]
    })

    return {
        success: true,
        provider: 'cloudinary-overlay',
        finalImageUrl: composedUrl
    }
}

const getOrderStatusReply = async (userId, message) => {
    const queryText = normalizeText(message)
    const candidate = queryText.match(/[a-z0-9-]{6,}/i)?.[0] || ''

    const userOrders = await orderModel.find({ userId }).sort({ date: -1 }).limit(10).lean()
    if (!userOrders.length) {
        return 'I could not find any orders on your account yet. Place your first order and I can track it for you instantly.'
    }

    let targetOrder = userOrders[0]

    if (candidate) {
        const matched = userOrders.find((order) => {
            return (
                String(order._id).includes(candidate) ||
                String(order.invoiceNumber || '').toLowerCase().includes(candidate.toLowerCase()) ||
                String(order.clientOrderId || '').toLowerCase().includes(candidate.toLowerCase())
            )
        })
        if (matched) targetOrder = matched
    }

    const etaMap = {
        'Order Placed': 'within 2-4 business days',
        Processing: 'within 1-3 business days',
        Shipped: 'within 1-2 business days',
        Delivered: 'already delivered',
        Cancelled: 'cancelled by support/admin'
    }

    return `Order ${targetOrder.invoiceNumber || targetOrder._id} is currently "${targetOrder.status}". Expected delivery: ${etaMap[targetOrder.status] || 'soon'}. Payment: ${targetOrder.payment ? 'Paid' : 'Pending'}.`
}

const getRecommendationReply = async () => {
    const topRated = await productModel.find({}).sort({ rating: -1, reviewCount: -1 }).limit(3).lean()
    if (!topRated.length) {
        return 'I am ready to recommend products, but I do not see products in stock yet.'
    }
    const names = topRated.map((item) => item.name).join(', ')
    return `Based on current trends, you can check: ${names}. Ask me for a specific category like jackets or topwear and I will narrow it down.`
}

const aiChatSupport = async (req, res) => {
    try {
        const { userId, message = '' } = req.body
        const text = normalizeText(message)

        if (!text) {
            return res.json({ success: true, reply: 'Ask me anything about products, orders, returns, or delivery times.' })
        }

        if (text.includes('track') || text.includes('order status') || text.includes('where is my order')) {
            const reply = await getOrderStatusReply(userId, text)
            return res.json({ success: true, reply })
        }

        if (text.includes('recommend') || text.includes('similar') || text.includes('popular')) {
            const reply = await getRecommendationReply()
            return res.json({ success: true, reply })
        }

        if (text.includes('return') || text.includes('exchange')) {
            return res.json({
                success: true,
                reply: 'You can request return or exchange within 7 days of delivery. Keep the product unused with original packaging, then contact support with your invoice number.'
            })
        }

        if (text.includes('delivery') || text.includes('shipping')) {
            return res.json({
                success: true,
                reply: 'Standard delivery is available across Bangladesh. Most orders are delivered in 2-4 business days after confirmation.'
            })
        }

        return res.json({
            success: true,
            reply: 'I can help with product recommendations, order tracking, delivery questions, returns, and payment status. Try: "track my latest order".'
        })
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

const generateVirtualTryOn = async (req, res) => {
    try {
        const userFile = req.files?.userImage?.[0]
        const garmentFile = req.files?.garmentImage?.[0]
        const garmentImageUrl = req.body?.garmentImageUrl
        const prompt = req.body?.prompt || ''
        const garmentDescription = req.body?.garmentDescription || ''
        const garmentCategory = req.body?.garmentCategory || ''
        const shouldRemoveBg = String(req.body?.removeBg ?? 'true').toLowerCase() !== 'false'

        if (!userFile) {
            return res.json({ success: false, message: 'userImage is required' })
        }

        const userBufferRaw = await fileToBuffer(userFile)
        if (!userBufferRaw) {
            return res.json({ success: false, message: 'Could not read user image' })
        }

        let garmentPayload = null
        if (garmentFile) {
            const garmentBuffer = await fileToBuffer(garmentFile)
            garmentPayload = {
                buffer: garmentBuffer,
                mimeType: garmentFile.mimetype || 'image/png'
            }
        } else if (garmentImageUrl) {
            garmentPayload = await fetchImageFromUrl(garmentImageUrl)
        }

        const baseUser = {
            buffer: userBufferRaw,
            mimeType: userFile.mimetype || 'image/png'
        }

        let userProcessed = baseUser
        let removeBgInfo = { removed: false, provider: 'none' }

        if (shouldRemoveBg) {
            try {
                const result = await removeBackgroundIfConfigured(baseUser.buffer, baseUser.mimeType)
                userProcessed = {
                    buffer: result.buffer,
                    mimeType: result.mimeType
                }
                removeBgInfo = { removed: result.removed, provider: result.provider }
            } catch (error) {
                removeBgInfo = { removed: false, provider: 'none', error: getErrorMessage(error) }
            }
        }

        if (garmentPayload?.buffer) {
            try {
                const replicateResult = await tryReplicateVirtualTryOn({
                    userBuffer: userProcessed.buffer,
                    userMimeType: userProcessed.mimeType,
                    garmentBuffer: garmentPayload.buffer,
                    garmentMimeType: garmentPayload.mimeType,
                    prompt,
                    garmentDescription,
                    garmentCategory
                })

                if (replicateResult?.success) {
                    const uploaded = await cloudinary.uploader.upload(bufferToDataUri(replicateResult.buffer, replicateResult.mimeType || 'image/png'), {
                        folder: 'virtual_tryon',
                        resource_type: 'image'
                    })

                    return res.json({
                        success: true,
                        provider: replicateResult.provider,
                        finalImageUrl: uploaded.secure_url,
                        removeBg: removeBgInfo,
                        sourceImageUrl: replicateResult.outputUrl
                    })
                }
            } catch (error) {
                console.log('Replicate try-on fallback:', getErrorMessage(error))
            }

            try {
                const hfResult = await tryHuggingFaceVirtualTryOn({
                    userBuffer: userProcessed.buffer,
                    userMimeType: userProcessed.mimeType,
                    garmentBuffer: garmentPayload.buffer,
                    garmentMimeType: garmentPayload.mimeType,
                    prompt
                })

                if (hfResult?.success) {
                    const uploaded = await cloudinary.uploader.upload(bufferToDataUri(hfResult.buffer, hfResult.mimeType || 'image/png'), {
                        folder: 'virtual_tryon',
                        resource_type: 'image'
                    })

                    return res.json({
                        success: true,
                        provider: hfResult.provider,
                        finalImageUrl: uploaded.secure_url,
                        removeBg: removeBgInfo
                    })
                }
            } catch (error) {
                console.log('HuggingFace try-on fallback:', getErrorMessage(error))
            }

            try {
                const fallback = await cloudinaryOverlayFallback({
                    userBuffer: userProcessed.buffer,
                    userMimeType: userProcessed.mimeType,
                    garmentBuffer: garmentPayload.buffer,
                    garmentMimeType: garmentPayload.mimeType
                })

                if (fallback.success) {
                    return res.json({
                        success: true,
                        provider: fallback.provider,
                        finalImageUrl: fallback.finalImageUrl,
                        removeBg: removeBgInfo
                    })
                }
            } catch (error) {
                console.log('Overlay fallback failed:', getErrorMessage(error))
            }
        }

        const uploadedUser = await cloudinary.uploader.upload(bufferToDataUri(userProcessed.buffer, userProcessed.mimeType || 'image/png'), {
            folder: 'virtual_tryon',
            resource_type: 'image'
        })

        return res.json({
            success: true,
            provider: removeBgInfo.removed ? 'remove.bg' : 'upload-only',
            finalImageUrl: uploadedUser.secure_url,
            removeBg: removeBgInfo,
            message: 'Garment input missing or AI model unavailable, returning processed user image only.'
        })
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

export { aiChatSupport, generateVirtualTryOn }
