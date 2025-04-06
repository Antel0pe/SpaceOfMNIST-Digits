"use client"

import { useRef, useEffect } from "react"

interface MnistImageProps {
  imageData: number[]
  width: number
  height: number
  className?: string
}

export default function MnistImage({ imageData, width, height, className = "" }: MnistImageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !imageData.length) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Set canvas dimensions to match the MNIST format (28x28)
    const mnistSize = 28
    canvas.width = mnistSize
    canvas.height = mnistSize

    // Create ImageData object
    const imgData = ctx.createImageData(mnistSize, mnistSize)

    // Fill the ImageData with pixel values from the MNIST vector
    for (let i = 0; i < imageData.length && i < 784; i++) {
      const pixelValue = imageData[i] * 255 // Assuming values are 0-1, scale to 0-255

      // Each pixel needs 4 values (r,g,b,a)
      const idx = i * 4
      imgData.data[idx] = pixelValue // R
      imgData.data[idx + 1] = pixelValue // G
      imgData.data[idx + 2] = pixelValue // B
      imgData.data[idx + 3] = 255 // Alpha (fully opaque)
    }

    // Put the image data on the canvas
    ctx.putImageData(imgData, 0, 0)
  }, [imageData])

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: `${width}px`,
        height: `${height}px`,
        imageRendering: "pixelated", // Keep the pixelated look when scaling up
      }}
      className={className}
    />
  )
}

