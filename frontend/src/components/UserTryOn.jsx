import React, { useContext, useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { ShopContext } from '../context/ShopContext'

let segmentationRuntime = null

const loadImageElement = (src) => new Promise((resolve, reject) => {
  const img = new Image()
  img.onload = () => resolve(img)
  img.onerror = reject
  img.src = src
})

const fileToDataUrl = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader()
  reader.onload = () => resolve(String(reader.result || ''))
  reader.onerror = reject
  reader.readAsDataURL(file)
})

const isImageData = (value) => {
  return value && value.data instanceof Uint8ClampedArray && Number.isFinite(value.width) && Number.isFinite(value.height)
}

const toImageDataSafe = (maskLike, width, height) => {
  if (isImageData(maskLike)) return maskLike

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) return null

  try {
    if (typeof HTMLCanvasElement !== 'undefined' && maskLike instanceof HTMLCanvasElement) {
      ctx.drawImage(maskLike, 0, 0, width, height)
      return ctx.getImageData(0, 0, width, height)
    }

    if (typeof ImageBitmap !== 'undefined' && maskLike instanceof ImageBitmap) {
      ctx.drawImage(maskLike, 0, 0, width, height)
      return ctx.getImageData(0, 0, width, height)
    }

    if (typeof HTMLImageElement !== 'undefined' && maskLike instanceof HTMLImageElement) {
      ctx.drawImage(maskLike, 0, 0, width, height)
      return ctx.getImageData(0, 0, width, height)
    }
  } catch (error) {
    console.log(error)
  }

  return null
}

const getBoundingBoxFromMask = (maskImageData) => {
  const { data, width, height } = maskImageData
  let minX = width
  let minY = height
  let maxX = -1
  let maxY = -1

  for (let i = 0; i < data.length; i += 4) {
    const alpha = data[i + 3]
    if (alpha <= 0) continue

    const pixelIndex = i / 4
    const x = pixelIndex % width
    const y = Math.floor(pixelIndex / width)

    if (x < minX) minX = x
    if (y < minY) minY = y
    if (x > maxX) maxX = x
    if (y > maxY) maxY = y
  }

  if (maxX < 0 || maxY < 0) return null
  return { minX, minY, maxX, maxY, width, height }
}

const getSegmentationRuntime = async () => {
  if (segmentationRuntime) return segmentationRuntime

  const tf = await import('@tensorflow/tfjs-core')
  await import('@tensorflow/tfjs-converter')
  await import('@tensorflow/tfjs-backend-webgl')
  await import('@tensorflow/tfjs-backend-cpu')
  const bodySegmentation = await import('@tensorflow-models/body-segmentation')

  let backend = 'webgl'
  try {
    await tf.setBackend('webgl')
  } catch (error) {
    backend = 'cpu'
    await tf.setBackend('cpu')
  }

  await tf.ready()

  const model = bodySegmentation.SupportedModels.MediaPipeSelfieSegmentation

  let segmenter = null
  let runtime = 'mediapipe'

  try {
    segmenter = await bodySegmentation.createSegmenter(model, {
      runtime: 'mediapipe',
      solutionPath: 'https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation',
      modelType: 'general'
    })
  } catch (error) {
    runtime = 'tfjs'
    segmenter = await bodySegmentation.createSegmenter(model, {
      runtime: 'tfjs',
      modelType: 'general'
    })
  }

  segmentationRuntime = { tf, bodySegmentation, segmenter, backend, runtime }
  return segmentationRuntime
}

const inferGarmentCategory = (category = '', subCategory = '', productName = '') => {
  const text = `${category} ${subCategory} ${productName}`.toLowerCase()

  if (/(dress|gown|kurti|jumpsuit)/.test(text)) return 'dresses'
  if (/(pant|trouser|jean|short|skirt|bottom)/.test(text)) return 'lower_body'
  return 'upper_body'
}

const UserTryOn = ({ productImage, productImages = [], productName = '', productCategory = '', productSubCategory = '' }) => {
  const { backendUrl } = useContext(ShopContext)
  const [userPhoto, setUserPhoto] = useState('')
  const [offsetX, setOffsetX] = useState(0)
  const [offsetY, setOffsetY] = useState(0)
  const [scale, setScale] = useState(1)
  const [opacity, setOpacity] = useState(0.82)
  const [isProcessing, setIsProcessing] = useState(false)
  const [statusText, setStatusText] = useState('')
  const [autoRotate360, setAutoRotate360] = useState(true)
  const [rotateIndex, setRotateIndex] = useState(0)
  const [garmentOnlyMode, setGarmentOnlyMode] = useState(true)
  const [showBasicOverlay, setShowBasicOverlay] = useState(false)
  const [isServerGenerated, setIsServerGenerated] = useState(false)
  const [rawUserPhoto, setRawUserPhoto] = useState('')

  const validProductImages = useMemo(() => {
    const arr = Array.isArray(productImages) ? productImages.filter(Boolean) : []
    if (arr.length) return arr
    return productImage ? [productImage] : []
  }, [productImages, productImage])

  const displayProductImage = validProductImages[rotateIndex] || validProductImages[0] || productImage
  const canRenderTryOn = useMemo(() => Boolean(userPhoto && displayProductImage), [userPhoto, displayProductImage])
  const canShowOverlayControls = useMemo(() => Boolean(!isServerGenerated && displayProductImage), [isServerGenerated, displayProductImage])
  const garmentCategory = useMemo(() => inferGarmentCategory(productCategory, productSubCategory, productName), [productCategory, productSubCategory, productName])
  const garmentDescription = useMemo(() => productName || `${productCategory} ${productSubCategory}`.trim(), [productName, productCategory, productSubCategory])

  useEffect(() => {
    if (!autoRotate360 || validProductImages.length < 2 || !canRenderTryOn) return undefined

    const timer = setInterval(() => {
      setRotateIndex((prev) => (prev + 1) % validProductImages.length)
    }, 900)

    return () => clearInterval(timer)
  }, [autoRotate360, validProductImages, canRenderTryOn])

  useEffect(() => {
    if (rotateIndex >= validProductImages.length) {
      setRotateIndex(0)
    }
  }, [validProductImages.length])

  const handleUpload = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    const objectUrl = URL.createObjectURL(file)
    const fallbackDataUrl = await fileToDataUrl(file)
    setRawUserPhoto(fallbackDataUrl)
    setIsProcessing(true)
    setShowBasicOverlay(false)
    setStatusText('Uploading image to AI try-on server...')

    try {
      if (backendUrl) {
        const formData = new FormData()
        formData.append('userImage', file)
        if (displayProductImage) {
          formData.append('garmentImageUrl', displayProductImage)
        }
        formData.append('removeBg', 'true')
        formData.append('prompt', 'Generate realistic ecommerce virtual try-on output')
        formData.append('garmentDescription', garmentDescription)
        formData.append('garmentCategory', garmentCategory)

        const response = await axios.post(`${backendUrl}/api/ai/virtual-tryon`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          timeout: 60000
        })

        if (response.data?.success && response.data?.finalImageUrl && ['huggingface', 'replicate'].includes(response.data?.provider)) {
          setUserPhoto(response.data.finalImageUrl)
          setIsServerGenerated(true)
          setOffsetX(0)
          setOffsetY(0)
          setScale(1)
          setOpacity(0.95)
          const provider = response.data.provider || 'ai'
          setStatusText(`AI try-on complete via ${provider}. You can still adjust overlay manually.`)
          return
        }

        if (response.data?.success) {
          setStatusText('AI try-on is not configured on the server yet. Showing a basic local preview instead.')
        }
      }
    } catch (error) {
      console.log('Backend try-on failed, using local fallback:', error)
    }

    setStatusText('AI server unavailable. Using local segmentation fallback...')

    try {
      const img = await loadImageElement(objectUrl)
      const { segmenter, bodySegmentation, backend, runtime } = await getSegmentationRuntime()
      setStatusText(`AI processing with ${runtime.toUpperCase()} (${backend.toUpperCase()})...`)

      const segmentation = await segmenter.segmentPeople(img, {
        multiSegmentation: false,
        segmentBodyParts: false,
        scoreThreshold: 0.3
      })

      if (!segmentation || segmentation.length === 0) {
        setUserPhoto(fallbackDataUrl)
        setStatusText('No body detected clearly. Using original image.')
        return
      }

      const maskImage = await bodySegmentation.toBinaryMask(
        segmentation,
        { r: 255, g: 255, b: 255, a: 255 },
        { r: 0, g: 0, b: 0, a: 0 },
        false,
        0.6
      )

      const maskImageData = toImageDataSafe(maskImage, img.naturalWidth, img.naturalHeight)
      if (!maskImageData) {
        setUserPhoto(fallbackDataUrl)
        setStatusText('Mask format unsupported in this browser. Using original image.')
        return
      }

      const outputCanvas = document.createElement('canvas')
      outputCanvas.width = img.naturalWidth
      outputCanvas.height = img.naturalHeight
      const outputCtx = outputCanvas.getContext('2d')

      const maskCanvas = document.createElement('canvas')
      maskCanvas.width = img.naturalWidth
      maskCanvas.height = img.naturalHeight
      const maskCtx = maskCanvas.getContext('2d')

      if (!outputCtx || !maskCtx) {
        setUserPhoto(fallbackDataUrl)
        setStatusText('Canvas not available. Using original image.')
        return
      }

      maskCtx.putImageData(maskImageData, 0, 0)
      outputCtx.drawImage(img, 0, 0, outputCanvas.width, outputCanvas.height)
      outputCtx.globalCompositeOperation = 'destination-in'
      outputCtx.drawImage(maskCanvas, 0, 0)
      outputCtx.globalCompositeOperation = 'source-over'

      const segmentedDataUrl = outputCanvas.toDataURL('image/png')
      setUserPhoto(segmentedDataUrl)
      setIsServerGenerated(false)
      setShowBasicOverlay(false)

      const bbox = getBoundingBoxFromMask(maskImageData)
      if (bbox) {
        const centerXRatio = ((bbox.minX + bbox.maxX) / 2) / bbox.width
        const torsoYRatio = (bbox.minY + (bbox.maxY - bbox.minY) * 0.42) / bbox.height
        const bodyWidthRatio = (bbox.maxX - bbox.minX) / bbox.width

        setOffsetX(Math.round((centerXRatio - 0.5) * 120))
        setOffsetY(Math.round((torsoYRatio - 0.5) * 180))
        setScale(Number(Math.max(0.65, Math.min(1.55, bodyWidthRatio * 1.9)).toFixed(2)))
        setOpacity(0.86)
      }

      setStatusText('Body isolated successfully. Basic overlay preview is available if you want to compare placement manually.')
    } catch (error) {
      console.log(error)
      setUserPhoto(fallbackDataUrl)
      setIsServerGenerated(false)
      setShowBasicOverlay(false)
      setStatusText('AI segmentation failed on this device/browser. Using original image (manual adjust still works).')
    } finally {
      setIsProcessing(false)
      URL.revokeObjectURL(objectUrl)
    }
  }

  const resetAdjustments = () => {
    setOffsetX(0)
    setOffsetY(0)
    setScale(1)
    setOpacity(0.82)
  }

  return (
    <div className='mt-8 border rounded p-4 bg-white'>
      <div className='flex items-center justify-between gap-3 mb-3'>
        <p className='font-medium'>Upload Photo Try-On</p>
        <label className='text-sm border px-3 py-1 cursor-pointer hover:bg-gray-50'>
          Upload Your Image
          <input type='file' accept='image/*' hidden onChange={handleUpload} />
        </label>
      </div>

      {!canRenderTryOn && (
        <p className='text-sm text-gray-500'>Upload your photo to preview this product on your body image.</p>
      )}

      {isProcessing && (
        <p className='text-sm text-blue-600 mb-3'>Processing image with AI...</p>
      )}

      {statusText && !isProcessing && (
        <p className='text-sm text-gray-600 mb-3'>{statusText}</p>
      )}

      {canRenderTryOn && (
        <>
          {validProductImages.length > 1 && (
            <div className='mb-3 flex items-center gap-3 text-sm'>
              <button
                type='button'
                onClick={() => setAutoRotate360((prev) => !prev)}
                className='border px-3 py-1 hover:bg-gray-50'
              >
                {autoRotate360 ? 'Stop 360 Rotate' : 'Start 360 Rotate'}
              </button>
              <span className='text-gray-600'>Frame {rotateIndex + 1}/{validProductImages.length}</span>
            </div>
          )}

          <div className='relative h-80 sm:h-[420px] overflow-hidden rounded bg-gray-100'>
            <img
              src={userPhoto}
              alt='user-upload'
              className='w-full h-full object-contain'
              onError={() => {
                if (rawUserPhoto && userPhoto !== rawUserPhoto) {
                  setUserPhoto(rawUserPhoto)
                  setIsServerGenerated(false)
                  setStatusText('Final AI image could not load. Showing uploaded image.')
                }
              }}
            />
            {showBasicOverlay && !isServerGenerated && (
              <img
                src={displayProductImage}
                alt='product-overlay'
                className='absolute left-1/2 top-1/2 w-[58%] h-auto object-contain pointer-events-none select-none'
                style={{
                  transform: `translate(calc(-50% + ${offsetX}px), calc(-50% + ${offsetY}px)) scale(${scale})`,
                  opacity,
                  clipPath: garmentOnlyMode ? 'inset(16% 20% 12% 20% round 10px)' : 'none',
                  filter: garmentOnlyMode ? 'contrast(1.05) saturate(1.08)' : 'none'
                }}
              />
            )}
          </div>

          {canShowOverlayControls && (
            <div className='mt-3'>
              <div className='flex flex-col gap-2 text-sm text-gray-700'>
                <label className='inline-flex items-center gap-2'>
                  <input
                    type='checkbox'
                    checked={showBasicOverlay}
                    onChange={(e) => setShowBasicOverlay(e.target.checked)}
                  />
                  Show basic overlay preview
                </label>
                {showBasicOverlay && (
                  <label className='inline-flex items-center gap-2'>
                    <input
                      type='checkbox'
                      checked={garmentOnlyMode}
                      onChange={(e) => setGarmentOnlyMode(e.target.checked)}
                    />
                    Crop overlay to the garment area
                  </label>
                )}
              </div>
            </div>
          )}

          {showBasicOverlay && !isServerGenerated && (
            <div className='mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm'>
            </div>
          )}

          {showBasicOverlay && !isServerGenerated && (
            <button type='button' onClick={resetAdjustments} className='mt-3 text-sm border px-3 py-2 hover:bg-gray-50'>
              Reset Try-On
            </button>
          )}
        </>
      )}
    </div>
  )
}

export default UserTryOn
