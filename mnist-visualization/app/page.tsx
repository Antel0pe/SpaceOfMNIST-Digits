"use client"

import { useState, useEffect, useMemo } from "react"
import { fetchNodeData, getNodeVector, getNodeNeighbors } from "@/lib/mnist-api"
import MnistImage from "@/components/mnist-image"

// Maximum number of thumbnails to display around the main image
const MAX_THUMBNAILS = 16

export default function MnistViewer() {
  const [currentNodeId, setCurrentNodeId] = useState<string | null>(null)
  const [mainImageData, setMainImageData] = useState<number[]>([])
  const [allNeighborNodeIds, setAllNeighborNodeIds] = useState<string[]>([])
  const [displayedNeighborNodeIds, setDisplayedNeighborNodeIds] = useState<string[]>([])
  const [neighborVectors, setNeighborVectors] = useState<{ [key: string]: number[] }>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isDataLoaded, setIsDataLoaded] = useState(false)

  // Load the JSON data on initial render
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      try {
        // Load the node data from JSON files
        await fetchNodeData()
        setIsDataLoaded(true)

        // Start with a random node (using "0" as default starting point)
        const startNodeId = "0"
        await selectNode(startNodeId)
      } catch (error) {
        console.error("Failed to load node data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [])

  // Function to randomly sample neighbors if there are too many
  const sampleNeighbors = (neighbors: string[], maxCount: number): string[] => {
    if (neighbors.length <= maxCount) {
      return [...neighbors]
    }

    // Random sampling without replacement
    const sampled: string[] = []
    const available = [...neighbors]

    while (sampled.length < maxCount && available.length > 0) {
      const randomIndex = Math.floor(Math.random() * available.length)
      sampled.push(available[randomIndex])
      available.splice(randomIndex, 1)
    }

    return sampled
  }

  // Function to select a node and load its neighbors
  const selectNode = async (nodeId: string) => {
    setIsLoading(true)
    try {
      // Get the vector for the selected node
      const vector = await getNodeVector(nodeId)
      if (!vector) {
        throw new Error(`No vector found for node ${nodeId}`)
      }

      // Set as main image
      setMainImageData(vector)
      setCurrentNodeId(nodeId)

      // Get all neighbor IDs
      const neighbors = await getNodeNeighbors(nodeId)
      setAllNeighborNodeIds(neighbors)

      // Sample neighbors if there are too many
      const displayNeighbors = sampleNeighbors(neighbors, MAX_THUMBNAILS)
      setDisplayedNeighborNodeIds(displayNeighbors)

      // Load vectors for all displayed neighbors
      const neighborData: { [key: string]: number[] } = {}
      for (const neighborId of displayNeighbors) {
        const neighborVector = await getNodeVector(neighborId)
        if (neighborVector) {
          neighborData[neighborId] = neighborVector
        }
      }

      setNeighborVectors(neighborData)
    } catch (error) {
      console.error(`Error selecting node ${nodeId}:`, error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleThumbnailClick = (nodeId: string) => {
    selectNode(nodeId)
  }

  // Calculate positions for thumbnails around the main image
  const thumbnailPositions = useMemo(() => {
    const positions: { top: string; left: string }[] = []
    const count = displayedNeighborNodeIds.length

    if (count === 0) return positions

    // Calculate positions in a circle around the main image
    for (let i = 0; i < count; i++) {
      // Calculate angle (in radians) for this thumbnail
      const angle = (i / count) * 2 * Math.PI

      // Calculate position (as percentages from center)
      // 50% is the center, so we add/subtract from there
      const top = 50 - 42 * Math.cos(angle)
      const left = 50 + 42 * Math.sin(angle)

      positions.push({
        top: `${top}%`,
        left: `${left}%`,
      })
    }

    return positions
  }, [displayedNeighborNodeIds])

  if (!isDataLoaded && isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-black p-4">
        <div className="text-white text-xl">Loading MNIST data...</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black p-4">
      {/* Main container with relative positioning */}
      <div className="relative w-[500px] h-[500px] flex items-center justify-center">
        {/* Main image display - current node */}
        <div className="w-64 h-64 bg-white rounded-md flex items-center justify-center p-2 z-10">
          {isLoading ? (
            <div className="animate-pulse bg-gray-200 w-56 h-56"></div>
          ) : (
            <>
              <MnistImage imageData={mainImageData} width={224} height={224} className="image-rendering-pixelated" />
              {currentNodeId && (
                <div className="absolute bottom-2 right-2 bg-black text-white text-xs px-2 py-1 rounded-md opacity-70">
                  Node: {currentNodeId}
                </div>
              )}
            </>
          )}
        </div>

        {/* Neighbor thumbnails positioned around the main image */}
        {displayedNeighborNodeIds.map((nodeId, index) => (
          <button
            key={nodeId}
            onClick={() => handleThumbnailClick(nodeId)}
            className="absolute w-16 h-16 bg-white rounded-md flex items-center justify-center hover:opacity-80 transition-opacity p-1 z-0"
            style={{
              top: thumbnailPositions[index]?.top,
              left: thumbnailPositions[index]?.left,
              transform: "translate(-50%, -50%)",
            }}
            disabled={isLoading}
          >
            {neighborVectors[nodeId] ? (
              <MnistImage
                imageData={neighborVectors[nodeId]}
                width={56}
                height={56}
                className="image-rendering-pixelated"
              />
            ) : (
              <div className="animate-pulse bg-gray-200 w-14 h-14"></div>
            )}
          </button>
        ))}
      </div>

      {/* Information display */}
      <div className="mt-8 text-white text-sm">
        <p>
          Current node: {currentNodeId} | Total neighbors: {allNeighborNodeIds.length} | Displayed:{" "}
          {displayedNeighborNodeIds.length}
        </p>
      </div>
    </div>
  )
}

