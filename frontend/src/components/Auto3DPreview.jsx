import React, { useEffect, useMemo, useRef, useState } from 'react'

const Auto3DPreview = ({ images = [] }) => {
  const validImages = useMemo(() => (Array.isArray(images) ? images.filter(Boolean) : []), [images])
  const [activeIndex, setActiveIndex] = useState(0)
  const [rotation, setRotation] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1.06)
  const containerRef = useRef(null)
  const isDraggingRef = useRef(false)
  const pinchDistanceRef = useRef(0)

  if (!validImages.length) return null

  const activeImage = validImages[activeIndex] || validImages[0]

  const updateRotationFromPoint = (clientX, clientY, target) => {
    const rect = target.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    const deltaX = (clientX - centerX) / (rect.width / 2)
    const deltaY = (clientY - centerY) / (rect.height / 2)

    setRotation({
      x: Math.max(-16, Math.min(16, -deltaY * 14)),
      y: Math.max(-20, Math.min(20, deltaX * 18))
    })
  }

  const handleMouseMove = (e) => updateRotationFromPoint(e.clientX, e.clientY, e.currentTarget)

  const handleTouchMove = (e) => {
    if (e.touches?.length === 2) {
      const [t1, t2] = e.touches
      const distance = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY)
      if (pinchDistanceRef.current) {
        const delta = distance - pinchDistanceRef.current
        setZoom((prev) => Math.max(0.85, Math.min(2.2, prev + delta * 0.003)))
      }
      pinchDistanceRef.current = distance
      return
    }

    const touch = e.touches?.[0]
    if (!touch) return
    updateRotationFromPoint(touch.clientX, touch.clientY, e.currentTarget)
  }

  const handlePointerDown = () => {
    isDraggingRef.current = true
  }

  const handlePointerUp = () => {
    isDraggingRef.current = false
  }

  const handleWheelZoom = (e) => {
    e.preventDefault()
    const direction = e.deltaY > 0 ? -0.08 : 0.08
    setZoom((prev) => Math.max(0.85, Math.min(2.2, prev + direction)))
  }

  useEffect(() => {
    const node = containerRef.current
    if (!node) return undefined

    const onWheel = (event) => handleWheelZoom(event)
    node.addEventListener('wheel', onWheel, { passive: false })

    return () => {
      node.removeEventListener('wheel', onWheel)
    }
  }, [])

  const resetView = () => {
    setRotation({ x: 0, y: 0 })
    setZoom(1.06)
  }

  const resetTilt = () => setRotation({ x: 0, y: 0 })

  return (
    <div className='mt-8 border p-4 rounded bg-gradient-to-br from-gray-50 to-white'>
      <div className='mb-3'>
        <p className='font-medium'>Smart 3D Preview (Auto)</p>
      </div>

      <div
        ref={containerRef}
        className='relative w-full h-64 sm:h-80 overflow-hidden rounded bg-gray-100 flex items-center justify-center perspective-[1200px] cursor-grab active:cursor-grabbing'
        onMouseMove={handleMouseMove}
        onTouchMove={handleTouchMove}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onMouseLeave={resetTilt}
        onTouchEnd={() => {
          pinchDistanceRef.current = 0
          resetTilt()
        }}
      >
        <img
          src={activeImage}
          alt='3d-preview'
          className='max-h-full max-w-full object-contain transition-transform duration-150 ease-out select-none pointer-events-none'
          style={{
            transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg) scale(${zoom}) translateZ(18px)`,
            filter: `drop-shadow(${rotation.y * -0.7}px ${rotation.x * 0.7}px 16px rgba(0,0,0,0.18))`
          }}
        />

        <div className='absolute top-2 right-2 flex items-center gap-1'>
          <button
            type='button'
            onClick={() => setZoom((prev) => Math.max(0.85, Math.min(2.2, prev - 0.1)))}
            className='w-7 h-7 bg-white/90 border rounded text-sm hover:bg-white'
          >
            -
          </button>
          <button
            type='button'
            onClick={() => setZoom((prev) => Math.max(0.85, Math.min(2.2, prev + 0.1)))}
            className='w-7 h-7 bg-white/90 border rounded text-sm hover:bg-white'
          >
            +
          </button>
          <button
            type='button'
            onClick={resetView}
            className='px-2 h-7 bg-white/90 border rounded text-[11px] hover:bg-white'
          >
            Reset
          </button>
        </div>
      </div>

      {validImages.length > 1 && (
        <div className='mt-3 flex items-center gap-2 overflow-x-auto'>
          {validImages.map((image, index) => (
            <button
              key={`${image}-${index}`}
              type='button'
              onClick={() => setActiveIndex(index)}
              className={`w-14 h-14 rounded overflow-hidden border ${index === activeIndex ? 'border-black' : 'border-gray-200'}`}
            >
              <img src={image} alt='thumb' className='w-full h-full object-cover' />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default Auto3DPreview
